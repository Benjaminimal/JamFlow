import { type JSX, type ReactNode, useState } from "react";

import { PlaybackContext } from "@/contexts/PlaybackContext";
import type { Playable } from "@/types";

export default function PlaybackProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [currentPlayable, setCurrentPlayable] = useState<Playable | null>(null);

  return (
    <PlaybackContext.Provider value={{ currentPlayable, setCurrentPlayable }}>
      {children}
    </PlaybackContext.Provider>
  );
}
