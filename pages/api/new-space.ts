import {
  createDatabase,
  getLatestIssueUpdateTime,
  initSpace,
} from "backend/data";
import type { NextApiRequest, NextApiResponse } from "next";
import { transact } from "backend/pg";
import { genSpaceID } from "util/common";

const newSpace = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("newSpace", req.query);
  const repoName = req.query["repoName"]?.toString();
  const repoOwner = req.query["repoOwner"]?.toString();
  if (repoName.length === 0 || repoOwner.length === 0) {
    res.status(400);
    res.json("repoName and repoOwner are required");
    res.end();
    return;
  }
  try {
    const spaceID = await transact(async (executor) => {
      await createDatabase(executor);
      const latestIssueTime = await getLatestIssueUpdateTime(
        executor,
        genSpaceID({ repoName, repoOwner })
      );
      return initSpace(executor, repoName, repoOwner, latestIssueTime);
    });
    res.status(200);
    res.json({ spaceID });
    res.end();
    return;
  } catch (e) {
    res.status(500);
    res.json(e);
    res.end();
    return;
  }
};

export default newSpace;
