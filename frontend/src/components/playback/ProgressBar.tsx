import { type JSX, useEffect, useRef, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import { formatDuration } from "@/lib/time";

export default function ProgressBar(): JSX.Element {
  const playback = usePlaybackContext();
  const { getPosition } = playback.actions;
  // TODO: we could try to replace this with the sliderRef value directly
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const spanRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // FIXME: while playing click to seek will make the progress jump back and forth one second
  useEffect(() => {
    if (!playback.derived.isPlaying) return;

    let lastSpanUpdate = 0;
    const spanThrottle = 250; // milliseconds

    const syncProgress = () => {
      const progress = isSeeking ? seekTarget : getPosition();
      if (sliderRef.current) {
        sliderRef.current.value = String(progress);
      }
      if (
        spanRef.current &&
        (isSeeking || Date.now() - lastSpanUpdate > spanThrottle)
      ) {
        spanRef.current.textContent = formatDuration(progress);
        lastSpanUpdate = Date.now();
      }
      requestAnimationFrame(syncProgress);
    };

    const refid = requestAnimationFrame(syncProgress);

    return () => cancelAnimationFrame(refid);
  }, [isSeeking, seekTarget, playback.derived.isPlaying, getPosition]);

  return (
    <>
      <span ref={spanRef} data-testid="audio-player-position"></span>
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max={playback.state.duration}
        step={100}
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => {
          playback.actions.seek(seekTarget);
          setIsSeeking(false);
        }}
        onChange={(e) => setSeekTarget(Number(e.target.value))}
        aria-label="seek position"
      />
      <span data-testid="audio-player-duration">
        {formatDuration(playback.state.duration)}
      </span>
    </>
  );
}
