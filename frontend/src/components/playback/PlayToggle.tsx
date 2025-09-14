import type { JSX } from "react";

import { PauseButton, PlayButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

// TODO: pass variants through to buttons?
export default function PlaybackToggle({
  className,
}: {
  className?: string;
}): JSX.Element {
  const {
    actions: { play, pause },
    derived,
  } = usePlaybackContext();

  return derived.isPlaying ? (
    <PauseButton onPause={pause} className={className} />
  ) : (
    <PlayButton onPlay={play} className={className} />
  );
}
