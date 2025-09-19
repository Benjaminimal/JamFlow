import { type JSX, useEffect, useRef, useState } from "react";

import { SliderFlat } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { formatDuration } from "@/lib/time";

export function ProgressBar(): JSX.Element {
  const playback = usePlaybackContext();
  const { getPosition } = playback.actions;
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!playback.derived.isPlaying) return;

    const syncProgress = () => {
      const progress = isSeeking ? seekTarget : getPosition();
      setPlaybackPosition(progress);
      const formattedDuration = formatDuration(progress);
      if (
        spanRef.current &&
        spanRef.current.textContent !== formattedDuration
      ) {
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
      <SliderFlat
        value={[playbackPosition]}
        min={0}
        max={playback.state.duration}
        step={100}
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => {
          playback.actions.seek(seekTarget);
          setIsSeeking(false);
        }}
        onValueChange={(values: number[]) => setSeekTarget(values[0])}
        aria-label="seek position"
      />
    </div>
  );
}
