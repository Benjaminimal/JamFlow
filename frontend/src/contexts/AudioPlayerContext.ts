import { createContext } from "react";

import { ApplicationError } from "@/errors";
import type { Track } from "@/types";

export type Playable = Track;

export type AudioPlayerContextType = {
  load: (v: Playable) => Promise<void>;
};

export const AudioPlayerContext = createContext<AudioPlayerContextType>({
  load: async () => {
    throw new ApplicationError("load called outside of NotificationProvider");
  },
});
