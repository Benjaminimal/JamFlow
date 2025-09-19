import type { JSX } from "react";

import { SliderFlat } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

type VolumeSliderProps = Omit<
  React.ComponentProps<typeof SliderFlat>,
  "min" | "max" | "value" | "onValueChange"
>;

export function VolumeSlider(props: VolumeSliderProps): JSX.Element {
  const {
    state: { volume },
    actions: { setVolume },
  } = usePlaybackContext();
  return (
    <SliderFlat
      min={0}
      max={100}
      value={[volume]}
      onValueChange={(values: number[]) => setVolume(Number(values[0]))}
      aria-label="change volume"
      {...props}
    />
  );
}
