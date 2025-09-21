import { type JSX, type ReactNode } from "react";

import { PlaybackContext } from "@/contexts/playback/PlaybackContext";
import { usePlayback } from "@/hooks/usePlayback";

export function PlaybackProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const value = usePlayback();

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}
