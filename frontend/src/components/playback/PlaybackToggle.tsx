import type { JSX } from "react";

import { PauseButton, PlayButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

export function PlaybackToggle({
  className,
}: {
  className?: string;
}): JSX.Element {
  const {
    actions: { play, pause },
    derived,
  } = usePlaybackContext();

  return derived.isPlaying ? (
    <PauseButton onClick={pause} className={className} />
  ) : (
    <PlayButton onClick={play} className={className} />
  );
}
