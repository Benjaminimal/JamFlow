import type { JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback/PlaybackContext";

export default function VolumeSlider(): JSX.Element {
  const {
    state: { volume },
    actions: { setVolume },
  } = usePlaybackContext();
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={volume}
      onChange={(e) => {
        setVolume(Number(e.target.value));
      }}
      aria-label="change volume"
    />
  );
}
