import type { JSX } from "react";

import { LoopButton, PauseButton, UnloopButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

type LoopToggleProps = React.ComponentProps<
  typeof LoopButton | typeof PauseButton
>;

export function LoopToggle(props: LoopToggleProps): JSX.Element {
  const {
    state: { isLooping },
    actions: { loop, unloop },
  } = usePlaybackContext();

  return isLooping ? (
    <UnloopButton onClick={unloop} {...props} />
  ) : (
    <LoopButton onClick={loop} {...props} />
  );
}
