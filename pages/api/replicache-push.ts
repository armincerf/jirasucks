import { transact } from "../../backend/pg";
import {
  createDatabase,
  getLastMutationIDs,
  getVersion,
  setLastMutationIDs,
  setVersion,
} from "../../backend/data";
import type { NextApiRequest, NextApiResponse } from "next";
import { ReplicacheTransaction } from "../../backend/replicache-transaction";
import { getSyncOrder } from "../../backend/sync-order";
import { mutators } from "../../frontend/mutators";
import { z } from "zod";
import type { MutatorDefs } from "replicache";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "util/constants";

// TODO: Either generate schema from mutator types, or vice versa, to tighten this.
// See notes in bug: https://github.com/rocicorp/replidraw/issues/47
const mutationSchema = z.object({
  clientID: z.string(),
  id: z.number(),
  name: z.string(),
  args: z.any(),
});

const pushRequestV0Schema = z.object({
  pushVersion: z.literal(0),
});

const pushRequestV1Schema = z.object({
  pushVersion: z.literal(1),
  profileID: z.string(),
  clientGroupID: z.string(),
  mutations: z.array(mutationSchema),
});

const pushRequestSchema = z.union([pushRequestV0Schema, pushRequestV1Schema]);

const push = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Processing push", JSON.stringify(req.body, null, ""));
  const spaceID = req.query["spaceID"].toString();

  const push = pushRequestSchema.parse(req.body);
  const { pushVersion } = push;

  // NOTE:
  // If pushVersion === 0, it is a user that is using an old client pre Replicache 13
  // return an error response that will cause the app to reload and get new Replicache 13 client code
  if (pushVersion === 0) {
    res.status(200);
    res.json({
      error: "ClientStateNotFound",
    });
    res.end();
    return;
  }
  const { clientGroupID } = push;

  const t0 = Date.now();
  const result = await transact(async (executor) => {
    await createDatabase(executor);

    const prevVersion = await getVersion(executor, spaceID);
    if (prevVersion === undefined) {
      return undefined;
    }
    const nextVersion = prevVersion + 1;
    const clientIDs = [...new Set(push.mutations.map((m) => m.clientID))];

    const lastMutationIDs = await getLastMutationIDs(executor, clientIDs);

    console.log(JSON.stringify({ prevVersion, nextVersion, lastMutationIDs }));

    for (let i = 0; i < push.mutations.length; i++) {
      const mutation = push.mutations[i];
      const { clientID } = mutation;
      const lastMutationID = lastMutationIDs[clientID];
      if (lastMutationID === undefined) {
        throw new Error(
          "invalid state - lastMutationID not found for client: " + clientID
        );
      }
      const expectedMutationID = lastMutationID + 1;

      if (mutation.id < expectedMutationID) {
        console.log(
          `Mutation ${mutation.id} has already been processed - skipping`
        );
        continue;
      }
      if (mutation.id > expectedMutationID) {
        console.warn(`Mutation ${mutation.id} is from the future - aborting`);
        break;
      }
      const tx = new ReplicacheTransaction(
        executor,
        spaceID,
        clientID,
        nextVersion,
        mutation.id,
        getSyncOrder
      );
      console.log("Processing mutation:", JSON.stringify(mutation, null, ""));

      const t1 = Date.now();
      const mutator = (mutators as MutatorDefs)[mutation.name];
      if (!mutator) {
        console.error(`Unknown mutator: ${mutation.name} - skipping`);
        continue;
      }

      try {
        await mutator(tx, mutation.args);
      } catch (e) {
        console.error(
          `Error executing mutator: ${JSON.stringify(mutation)}`,
          e
        );
      }
      lastMutationIDs[clientID] = expectedMutationID;
      console.log("Processed mutation in", Date.now() - t1);
      await Promise.all([
        setLastMutationIDs(
          executor,
          clientGroupID,
          lastMutationIDs,
          nextVersion
        ),
        setVersion(executor, spaceID, nextVersion),
        tx.flush(),
      ]);
    }
    return true;
  });
  if (supabaseUrl && supabaseAnonKey) {
    const startPoke = Date.now();
    const sb = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const channel = sb.channel(spaceID);

    channel.subscribe(async (status) => {
      switch (status) {
        case "CLOSED":
          console.log("Channel closed");
          break;
        case "TIMED_OUT":
          console.log("Channel timed out");
          break;
        case "CHANNEL_ERROR":
          console.log("Channel error");
          break;
        case "SUBSCRIBED":
          console.log("Channel subscribed");
          await channel.send({
            type: "broadcast",
            event: "poke",
          });
          console.log("Poke took", Date.now() - startPoke);
          break;
      }
    });
    await sleep(300);
  } else {
    console.log("Not poking because Realtime is not configured");
  }

  if (!result) {
    res.status(404);
    res.end();
    return;
  }

  console.log("Processed all mutations in", Date.now() - t0);
  res.status(200).json({});
};

export default push;

async function sleep(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}
