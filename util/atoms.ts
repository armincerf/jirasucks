import type { M } from "frontend/mutators";
import { atom } from "jotai";
import type { Replicache } from "replicache";

export const repAtom = atom<Replicache<M> | null>(null);
