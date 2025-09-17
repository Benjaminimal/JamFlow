import type { JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import { Slider } from "@/ui-lib";

type VolumeSliderProps = Omit<
  React.ComponentProps<typeof Slider>,
  "min" | "max" | "value" | "onValueChange"
>;

export function VolumeSlider(props: VolumeSliderProps): JSX.Element {
  const {
    state: { volume },
    actions: { setVolume },
  } = usePlaybackContext();
  return (
    <Slider
      min={0}
      max={100}
      value={[volume]}
      onValueChange={(values: number[]) => setVolume(Number(values[0]))}
      aria-label="change volume"
      {...props}
    />
  );
}
