import type { JSX } from "react";

import { SliderFlat } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

type VolumeSliderProps = Omit<
  React.ComponentProps<typeof SliderFlat>,
  "min" | "max" | "value" | "onValueChange"
>;

export function VolumeSlider(props: VolumeSliderProps): JSX.Element {
  const {
    state: { volume, isMuted },
    actions: { setVolume, unmute },
  } = usePlaybackContext();

  const displayVolume = isMuted ? 0 : volume;

  return (
    <SliderFlat
      min={0}
      max={100}
      value={[displayVolume]}
      onValueChange={(values: number[]) => {
        if (isMuted) {
          unmute();
        }
        setVolume(values[0]);
      }}
      aria-label="change volume"
      {...props}
    />
  );
}
