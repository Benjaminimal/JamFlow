import type { JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import { Slider } from "@/ui-lib";

export default function VolumeSlider(): JSX.Element {
  const {
    state: { volume },
    actions: { setVolume },
  } = usePlaybackContext();
  return (
    <Slider
      className="!min-h-12"
      orientation="vertical"
      min={0}
      max={100}
      value={[volume]}
      onValueChange={(values: number[]) => setVolume(Number(values[0]))}
      aria-label="change volume"
    />
  );
}
