import type { JSX, ReactNode } from "react";

import AudioPlayer from "@/components/AudioPlayer";
import {
  AudioPlayerContext,
  type Playable,
} from "@/contexts/AudioPlayerContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

// TODO: use the context to select tracks
export default function AudioPlayerProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { title, setTitle, active, setActive } = useAudioPlayer();

  const load = async (playable: Playable) => {
    setActive(true);
    setTitle(playable.title);
  };

  return (
    <AudioPlayerContext.Provider value={{ load }}>
      {children}
      {active && (
        //  TODO: remove debug styling
        <div
          style={{
            borderTop: "2px solid #fff",
          }}
        >
          <AudioPlayer title={title} />
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}
