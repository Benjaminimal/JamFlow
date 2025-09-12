import type { JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback";

export default function MuteToggle(): JSX.Element {
  const {
    state: { isMuted },
    actions: { mute, unmute },
  } = usePlaybackContext();
  return (
    <button
      type="button"
      onClick={isMuted ? unmute : mute}
      aria-label={isMuted ? "unmute" : "mute"}
    >
      {isMuted ? "Unmute" : "Mute"}
    </button>
  );
}
