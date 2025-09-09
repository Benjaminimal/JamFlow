import { type JSX, type ReactNode, useMemo, useState } from "react";

import { PlaybackContext } from "@/contexts/PlaybackContext";
import type { Playable } from "@/types";

export default function PlaybackProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [currentPlayable, setCurrentPlayable] = useState<Playable | null>(null);

  const providerValue = useMemo(
    () => ({ currentPlayable, setCurrentPlayable }),
    [currentPlayable],
  );

  return (
    <PlaybackContext.Provider value={providerValue}>
      {children}
    </PlaybackContext.Provider>
  );
}
