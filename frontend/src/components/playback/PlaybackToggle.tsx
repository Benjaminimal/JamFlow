import type { JSX } from "react";

import { PauseButton, PlayButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

type PlaybackToggleProps = React.ComponentProps<
  typeof PlayButton | typeof PauseButton
>;

export function PlaybackToggle(props: PlaybackToggleProps): JSX.Element {
  const {
    actions: { play, pause },
    derived,
  } = usePlaybackContext();

  return derived.isPlaying ? (
    <PauseButton onClick={pause} {...props} />
  ) : (
    <PlayButton onClick={play} {...props} />
  );
}
