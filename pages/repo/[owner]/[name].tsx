import { useEffect, useRef, useState } from "react";
import { Replicache } from "replicache";
import { M, mutators } from "frontend/mutators";
import App from "frontend/app";
import { UndoManager } from "@rocicorp/undo";
import { transact } from "backend/pg";
import {
  createDatabase,
  getLatestIssueUpdateTime,
  initSpace,
} from "backend/data";
import type { GetServerSideProps } from "next";
import { genSpaceID } from "util/common";
import { replicacheKey, supabaseAnonKey, supabaseUrl } from "util/constants";
import { createClient } from "@supabase/supabase-js";
import { useAtom } from "jotai";
import { repAtom } from "util/atoms";

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
  const [rep, setRep] = useAtom(repAtom);
  const undoManagerRef = useRef(new UndoManager());
  useEffect(() => {
    // disabled eslint await requirement
    // eslint-disable-next-line
    (async () => {
      if (!replicacheKey) {
        console.error("Replicache key is not set");
        return;
      }
      if (rep) {
        return;
      }

      const r = new Replicache({
        pushURL: `/api/replicache-push?spaceID=${spaceID}`,
        pullURL: `/api/replicache-pull?spaceID=${spaceID}`,
        name: spaceID,
        mutators,
        pullInterval: 30000,
        licenseKey: replicacheKey,
      });

      if (supabaseAnonKey && supabaseUrl) {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
        });
        const channel = client.channel(spaceID);
        channel
          .on("broadcast", { event: "poke" }, () => {
            console.log("poke received");
            return r.pull();
          })
          .subscribe();

        console.log("channel", channel);
      } else {
        console.error("Supabase key or url is not set");
      }

      setRep(r);
    })();
  }, [rep, spaceID]);

  if (!rep) {
    return null;
  }
  return (
    <div className="repliear">
      <App rep={rep} undoManager={undoManagerRef.current} />
    </div>
  );
}
