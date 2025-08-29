import { createContext } from "react";

import { ApplicationError } from "@/errors";
import type { Playable } from "@/types";

export type PlayableContextType = {
  playable: Playable | null;
  setPlayable: (v: Playable) => void;
};

export const PlayableContext = createContext<PlayableContextType>({
  setPlayable: () => {
    throw new ApplicationError("setPlayable called outside of provider");
  },
  playable: null,
});
