import { createContext, useContext } from "react";

import type { PlaybackContextType } from "@/contexts/playback/types";

export const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined,
);

export function usePlaybackContext(): PlaybackContextType {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error(
      "usePlaybackContext must be used within a PlaybackProvider",
    );
  }
  return context;
}
