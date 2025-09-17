import type { JSX } from "react";

import { MuteButton, UnmuteButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

type MuteToggleProps = React.ComponentProps<
  typeof UnmuteButton | typeof MuteButton
>;

export function MuteToggle(props: MuteToggleProps): JSX.Element {
  const {
    state: { isMuted, volume },
    actions: { mute, unmute },
  } = usePlaybackContext();

  return isMuted || volume === 0 ? (
    <UnmuteButton onClick={unmute} {...props} />
  ) : (
    <MuteButton onClick={mute} {...props} />
  );
}
