import { Octokit } from "@octokit/rest";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

function fetchComments({
  repoName,
  repoOwner,
  issueNumber,
  commentsArray,
}: {
  repoName: string;
  repoOwner: string;
  issueNumber: number;
  commentsArray: TComment[];
}) {
  console.log(`Fetching comments for issue ${issueNumber}`);
  octokit
    .paginate(octokit.rest.issues.listComments, {
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
    })
    .then((comments) => {
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
        commentsArray.push(formattedComment);
      });
      sleep(100);
    });
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
  updatedAt?: Date;
}) {
  console.log(`Fetching issues for ${repoName}, last updated at ${updatedAt}`);
  let issuesArray: TIssue[] = [];
  let commentsArray: TComment[] = [];
  const updatedISO = updatedAt?.toISOString();
  const baseOpts = {
    owner: repoOwner,
    repo: repoName,
  };
  // if updatedAt is provided, only fetch issues updated after that date
  const opts = updatedISO
    ? {
      ...baseOpts,
      since: updatedISO,
    }
    : baseOpts;
  octokit.paginate(octokit.rest.issues.listForRepo, opts).then((issues) => {
    console.log(`Fetched ${issues.length} issues for ${repoName}`);
    issues.map((issue) => {
      // write each block of issues to a file
      // for each issue call fetchComments
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
      fetchComments({
        repoName,
        repoOwner,
        issueNumber: issue.number,
        commentsArray,
      });
    });
    sleep(100);
  });
  return {
    issuesArray,
    commentsArray,
  };
}
