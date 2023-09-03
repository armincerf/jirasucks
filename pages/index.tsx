import { transact } from "../backend/pg";
import { createDatabase, getLatestIssue, initSpace } from "../backend/data";

function Page() {
  return "";
}

export async function getServerSideProps() {
  const spaceID = await transact(async (executor) => {
    await createDatabase(executor);
    const latestReactIssue = await getLatestIssue(
      executor,
      "facebook/react-space"
    );
    return initSpace(executor, "react", "facebook", latestReactIssue);
  });
  return {
    redirect: {
      destination: `/d/${spaceID}`,
      permanent: false,
    },
  };
}

export default Page;
