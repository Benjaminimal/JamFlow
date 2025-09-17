import { type JSX, useEffect, useRef, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import { formatDuration } from "@/lib/time";
import { Slider } from "@/ui-lib";

export default function ProgressBar(): JSX.Element {
  const playback = usePlaybackContext();
  const { getPosition } = playback.actions;
  // TODO: we could try to replace this with the sliderRef value directly
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const spanRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!playback.derived.isPlaying) return;

    const syncProgress = () => {
      const progress = isSeeking ? seekTarget : getPosition();
      if (sliderRef.current) {
        sliderRef.current.value = String(progress);
      }
      if (spanRef.current) {
        spanRef.current.textContent = formatDuration(progress);
      }
      requestAnimationFrame(syncProgress);
    };

    const refid = requestAnimationFrame(syncProgress);

    return () => cancelAnimationFrame(refid);
  }, [isSeeking, seekTarget, playback.derived.isPlaying, getPosition]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-muted-foreground flex flex-row justify-between">
        <span ref={spanRef} data-testid="audio-player-position"></span>
        <span data-testid="audio-player-duration">
          {formatDuration(playback.state.duration)}
        </span>
      </div>
      <Slider
        ref={sliderRef}
        min={0}
        max={playback.state.duration}
        step={100}
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => {
          playback.actions.seek(seekTarget);
          setIsSeeking(false);
        }}
        onValueChange={(values: number[]) => setSeekTarget(Number(values[0]))}
        aria-label="seek position"
      />
    </div>
  );
}
