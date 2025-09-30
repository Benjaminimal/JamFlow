import { type JSX } from "react";

import { Slider } from "@/ui-lib";

type PorgressSliderProps = {
  playbackPosition: number;
  duration: number;
  seekTarget: number;
  setSeekTarget: (value: number) => void;
  setIsSeeking: (value: boolean) => void;
  seek: (position: number) => void;
};

export function ProgressSlider({
  playbackPosition,
  duration,
  seekTarget,
  setSeekTarget,
  setIsSeeking,
  seek,
}: PorgressSliderProps): JSX.Element {
  return (
    <Slider
      value={[playbackPosition]}
      min={0}
      max={duration}
      step={100}
      onPointerDown={() => setIsSeeking(true)}
      onPointerUp={() => {
        seek(seekTarget);
        setIsSeeking(false);
      }}
      onValueChange={(values: number[]) => setSeekTarget(values[0])}
      role="slider"
      aria-label="seek position"
    />
  );
}
