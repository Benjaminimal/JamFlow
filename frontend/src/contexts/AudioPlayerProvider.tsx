import type { JSX, ReactNode } from "react";

import { AudioPlayerContext } from "@/contexts/AudioPlayerContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export default function AudioPlayerProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
