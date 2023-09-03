import { transact } from "../backend/pg";
import {
  createDatabase,
  getLatestIssueUpdateTime,
  initSpace,
} from "../backend/data";
import { genSpaceID } from "util/common";

function Page() {
  return "";
}

export async function getServerSideProps() {
  const spaceID = await transact(async (executor) => {
    await createDatabase(executor);
    const latestReactIssueTime = await getLatestIssueUpdateTime(
      executor,
      genSpaceID({ repoOwner: "facebook", repoName: "react" })
    );
    return initSpace(
      executor,
      "react",
      "facebook",
      latestReactIssueTime,
      false
    );
  });
  return {
    redirect: {
      destination: `/repo/facebook/react`,
      permanent: false,
    },
  };
}

export default Page;
