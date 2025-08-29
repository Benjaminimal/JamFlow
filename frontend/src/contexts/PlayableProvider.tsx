import { type JSX, type ReactNode, useState } from "react";

import { PlayableContext } from "@/contexts/PlayableContext";
import type { Playable } from "@/types";

export default function PlayableProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [playable, setPlayable] = useState<Playable | null>(null);

  return (
    <PlayableContext.Provider value={{ playable, setPlayable }}>
      {children}
    </PlayableContext.Provider>
  );
}
