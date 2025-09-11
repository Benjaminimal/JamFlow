import type { JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback";

export default function PlayToggle(): JSX.Element {
  const {
    actions: { play, pause },
    derived,
  } = usePlaybackContext();
  return (
    <button
      type="button"
      onClick={derived.isPlaying ? pause : play}
      aria-label={derived.isPlaying ? "pause" : "play"}
    >
      {derived.isPlaying ? "Pause" : "Play"}
    </button>
  );
}
