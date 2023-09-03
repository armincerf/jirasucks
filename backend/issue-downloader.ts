import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: "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",
  userAgent: "issue-downloader",
  timeZone: "Europe/London",
  baseUrl: "https://api.github.com",
  log: {
    debug: () => { },
    info: () => { },
    warn: console.warn,
    error: console.error,
  },
  request: {
    agent: undefined,
    fetch: undefined,
    timeout: 0,
  },
});

export type TComment = {
  number: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  comment_id: string;
  body: string | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  creator_user_login: string;
};

async function fetchComments({
  repoName,
  repoOwner,
  issueNumber,
}: {
  repoName: string;
  repoOwner: string;
  issueNumber: number;
}) {
  console.log(`Fetching comments for issue ${issueNumber}`);
  const commentIterator = octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    {
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
      per_page: 100,
    }
  );
  const coms: TComment[] = [];
  for await (const { data: comments } of commentIterator) {
    console.log(`Fetched ${comments.length} comments for issue ${issueNumber}`);
    comments.map((comment) => {
      // write each block of comments to a file
      const formattedComment: TComment = {
        number: issueNumber,
        comment_id: comment.id.toString(),
        body: comment.body || "",
        updated_at: comment.updated_at,
        created_at: comment.created_at,
        creator_user_login: comment.user ? comment.user.login : "anon",
      };
      coms.push(formattedComment);
    });
  }
  return coms;
}

export type TIssue = {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  // eslint-disable-next-line @typescript-eslint/naming-convention
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  creator_user_login: string;
};

export type TIssueWithComments = TIssue & {
  comments: TComment[];
};

export async function getMissingIssues({
  repoName,
  repoOwner,
  updatedAt,
}: {
  repoName: string;
  repoOwner: string;
  updatedAt: Date | undefined;
}) {
  console.log(
    `Fetching issues for ${repoOwner}/${repoName}, last updated at ${updatedAt}`
  );
  let issuesArray: TIssue[] = [];
  let commentsArray: TComment[] = [];
  const updatedDatePlusOneDay = updatedAt
    ? new Date(updatedAt.getTime() + 86400000)
    : undefined;

  const updatedISO =
    updatedDatePlusOneDay?.toISOString().substr(0, 10) + "T00:00:00Z";
  const baseOpts = {
    owner: repoOwner,
    repo: repoName,
    per_page: 100,
  } as const;
  // if updatedAt is provided, only fetch issues updated after that date
  const opts =
    updatedISO && updatedISO.length === 29
      ? {
        ...baseOpts,
        since: updatedISO,
      }
      : baseOpts;
  console.log("opts", opts);
  const issueIterator = octokit.paginate.iterator(
    octokit.rest.issues.listForRepo,
    opts
  );
  for await (const { data: issues } of issueIterator) {
    console.log(`Fetched ${issues.length} issues`);
    for await (const issue of issues) {
      const formattedIssue: TIssue = {
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        state: issue.state as "open" | "closed",
        updated_at: issue.updated_at,
        created_at: issue.created_at,
        creator_user_login: issue.user ? issue.user.login : "anon",
      };
      issuesArray.push(formattedIssue);
    }

    console.log(
      `Fetched ${issuesArray.length} and ${commentsArray.length} issues for ${repoName}`
    );
  }
  return {
    issuesArray,
    commentsArray,
  };
}
