import { useEffect, useRef, useState } from "react";
import { Replicache } from "replicache";
import { M, mutators } from "frontend/mutators";
import App from "frontend/app";
import Pusher from "pusher-js";
import { UndoManager } from "@rocicorp/undo";
import { transact } from "backend/pg";
import {
  createDatabase,
  getLatestIssueUpdateTime,
  initSpace,
} from "backend/data";
import type { GetServerSideProps } from "next";
import { genSpaceID } from "util/common";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const params = ctx.params;
  if (!params) {
    throw new Error("params is undefined");
  }
  console.log("params", params);
  const repoOwner = params.owner.toString();
  const repoName = params.name.toString();

  const since = ctx.query.since?.toString();
  const sync = ctx.query.sync?.toString() === "true";
  const skipSync = ctx.query.skipSync?.toString() === "true";
  const spaceID = await transact(async (executor) => {
    await createDatabase(executor);
    const latestIssueTime = since
      ? new Date(since)
      : await getLatestIssueUpdateTime(
        executor,
        genSpaceID({ repoOwner, repoName })
      );
    console.log("latestIssue", latestIssueTime, since, sync);
    return initSpace(
      executor,
      repoName,
      repoOwner,
      latestIssueTime,
      sync,
      skipSync
    );
  });
  return {
    props: {
      spaceID,
    },
  };
};

export default function Home({ spaceID }: { spaceID: string }) {
  const [rep, setRep] = useState<Replicache<M> | null>(null);
  const undoManagerRef = useRef(new UndoManager());
  useEffect(() => {
    // disabled eslint await requirement
    // eslint-disable-next-line
    (async () => {
      if (rep) {
        return;
      }

      const r = new Replicache({
        pushURL: `/api/replicache-push?spaceID=${spaceID}`,
        pullURL: `/api/replicache-pull?spaceID=${spaceID}`,
        name: spaceID,
        mutators,
        pullInterval: 30000,
        // To get your own license key run `npx replicache get-license`. (It's free.)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
      });

      if (
        process.env.NEXT_PUBLIC_PUSHER_KEY &&
        process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      ) {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe("default");
        channel.bind("poke", () => {
          r.pull();
        });
      }

      setRep(r);
    })();
  }, [rep]);

  if (!rep) {
    return null;
  }
  return (
    <div className="repliear">
      <App rep={rep} undoManager={undoManagerRef.current} />
    </div>
  );
}
