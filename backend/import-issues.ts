import { Priority, Status } from "../frontend/issue";
import { generateNKeysBetween } from "fractional-indexing";
import { sortBy } from "lodash";
import { getMissingIssues, TComment, TIssue } from "./issue-downloader";
import type { SampleData } from "./data";

export async function getIssueData({
  repoOwner,
  repoName,
  latestIssueTime,
  sync,
}: {
  repoOwner: string;
  repoName: string;
  latestIssueTime: Date | undefined;
  sync?: boolean;
}) {
  console.log("latestIssue", latestIssueTime);
  const shouldSync = latestIssueTime === undefined || sync;
  const { issuesArray: issuesDefault, comments } = shouldSync
    ? await getMissingIssues({
      repoOwner,
      repoName,
      updatedAt: latestIssueTime,
    })
    : { issuesArray: [], comments: [] };

  console.log("fetched issues", {
    issueCount: issuesDefault.length,
    commentsCount: comments.length,
  });

  const commentsForIssue = (issue: TIssue) => {
    return comments.filter((comment) => comment.number === issue.number);
  };

  const sortedIssues = sortBy(
    issuesDefault,
    (issue) =>
      Number.MAX_SAFE_INTEGER -
      Date.parse(issue.updated_at) +
      "-" +
      issue.number
  );

  const issuesCount = issuesDefault.length;
  const kanbanOrderKeys = generateNKeysBetween(null, null, issuesCount);
  const formatComment = (comment: TComment) => {
    console.log("comment formatting", comment.number);
    return {
      id: comment.comment_id,
      issueID: comment.number.toString(),
      created: Date.parse(comment.created_at),
      body: comment.body || "",
      creator: comment.creator_user_login,
    };
  };

  const issues: SampleData = sortedIssues.map((issue, idx) => ({
    issue: {
      id: issue.number.toString(),
      title: issue.title,
      priority: getPriority(issue),
      status: getStatus(issue),
      modified: Date.parse(issue.updated_at),
      created: Date.parse(issue.created_at),
      creator: issue.creator_user_login,
      kanbanOrder: kanbanOrderKeys[idx],
    },
    description: issue.body || "",
    comments: commentsForIssue(issue).map(formatComment),
  }));

  // Can use this to generate artifically larger datasets for stress testing.
  const multiplied: SampleData = [];
  for (let i = 0; i < 1; i++) {
    multiplied.push(
      ...issues.map((issue) => ({
        ...issue,
        issue: {
          ...issue.issue,
          id: issue.issue.id + "-" + i,
        },
        comments: issue.comments.map((comment) => ({
          ...comment,
          issueID: comment.issueID + "-" + i,
        })),
      }))
    );
  }

  return multiplied;
}

function getStatus({
  number,
  created_at,
}: {
  number: number;
  state: "open" | "closed";
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;
}): Status {
  const stableRandom = number + Date.parse(created_at);
  // 90% closed, 10% open
  if (stableRandom % 10 < 8) {
    // 2/3's done, 1/3 cancelled
    switch (stableRandom % 3) {
      case 0:
      case 1:
        return Status.DONE;
      case 2:
        return Status.CANCELED;
    }
  }
  switch (stableRandom % 6) {
    // 2/6 backlog, 3/6 todo, 1/6 in progress
    case 0:
    case 1:
      return Status.BACKLOG;
    case 2:
    case 3:
    case 4:
      return Status.TODO;
    case 5:
      return Status.IN_PROGRESS;
  }
  return Status.TODO;
}

function getPriority({
  number,
  created_at,
}: {
  number: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;
}): Priority {
  const stableRandom = number + Date.parse(created_at);
  // bell curve priorities
  switch (stableRandom % 10) {
    case 0:
      return Priority.NONE;
    case 1:
    case 2:
      return Priority.LOW;
    case 3:
    case 4:
    case 5:
    case 6:
      return Priority.MEDIUM;
    case 7:
    case 8:
      return Priority.HIGH;
    case 9:
      return Priority.URGENT;
  }
  return Priority.NONE;
}
