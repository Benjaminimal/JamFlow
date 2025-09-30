import { type JSX } from "react";

import { ProgressSlider } from "@/components/playback";
import { useProgressBar } from "@/hooks/useProgressBar";
import { formatDuration } from "@/lib/time";

export function ProgressBar(): JSX.Element {
  const {
    playbackPosition,
    duration,
    setIsSeeking,
    seekTarget,
    setSeekTarget,
    seek,
  } = useProgressBar();

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
      <ProgressSlider
        playbackPosition={playbackPosition}
        duration={duration}
        seekTarget={seekTarget}
        setSeekTarget={setSeekTarget}
        setIsSeeking={setIsSeeking}
        seek={seek}
      />
    </div>
  );
}
