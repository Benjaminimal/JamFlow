import { createContext } from "react";

import { ApplicationError } from "@/errors";
import type { Playable } from "@/types";

export type AudioPlayerContextType = {
  load: (v: Playable) => Promise<void>;
};

export const AudioPlayerContext = createContext<AudioPlayerContextType>({
  load: async () => {
    throw new ApplicationError("load called outside of AudioPlayerProvider");
  },
});
