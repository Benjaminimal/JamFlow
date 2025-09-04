import { createContext, useContext } from "react";

import { ApplicationError } from "@/errors";
import type { Playable } from "@/types";

export type PlaybackContextType = {
  currentPlayable: Playable | null;
  setCurrentPlayable: (v: Playable) => void;
};

export const PlaybackContext = createContext<PlaybackContextType>({
  setCurrentPlayable: () => {
    throw new ApplicationError("setCurrentPlayable called outside of provider");
  },
  currentPlayable: null,
});

export function usePlaybackContext(): PlaybackContextType {
  return useContext(PlaybackContext);
}
