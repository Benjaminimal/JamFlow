import { type JSX, useEffect, useState } from "react";

import { SliderFlat } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { formatDuration } from "@/lib/time";

export function ProgressBar(): JSX.Element {
  const {
    state: { duration },
    actions: { seek, subscribe },
  } = usePlaybackContext();
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    const syncPosition = (event: PlaybackEvent) => {
      if (event.type !== "progress") return;
      const position = isSeeking ? seekTarget : event.position;

      setPlaybackPosition(position);
    };

    const unsubscribe = subscribe(syncPosition);

    return () => unsubscribe();
  }, [isSeeking, seekTarget, subscribe]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="text-muted-foreground flex flex-row justify-between">
        <span data-testid="audio-player-position">
          {formatDuration(playbackPosition)}
        </span>
        <span data-testid="audio-player-duration">
          {formatDuration(duration)}
        </span>
      </div>
      <SliderFlat
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
    </div>
  );
}
