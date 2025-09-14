import type { JSX } from "react";

import { PauseButton, PlayButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

export default function PlayToggle(): JSX.Element {
  const {
    actions: { play, pause },
    derived,
  } = usePlaybackContext();

  return derived.isPlaying ? (
    <PauseButton onPause={pause} />
  ) : (
    <PlayButton onPlay={play} />
  );
}
