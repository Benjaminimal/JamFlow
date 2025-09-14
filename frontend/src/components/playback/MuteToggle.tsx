import type { JSX } from "react";

import { MuteButton, UnmuteButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

export function MuteToggle({ className }: { className?: string }): JSX.Element {
  const {
    state: { isMuted },
    actions: { mute, unmute },
  } = usePlaybackContext();

  return isMuted ? (
    <UnmuteButton onClick={unmute} className={className} />
  ) : (
    <MuteButton onClick={mute} className={className} />
  );
}
