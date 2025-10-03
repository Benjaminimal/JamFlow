import { type JSX } from "react";

import { ProgressSlider } from "@/components/playback";
import { useProgressBar } from "@/hooks/useProgressBar";
import { formatDuration } from "@/lib/time";

export function ProgressBarCompact(): JSX.Element {
  const {
    playbackPosition,
    duration,
    setIsSeeking,
    seekTarget,
    setSeekTarget,
    seek,
  } = useProgressBar();

  return (
    <div className="text-muted-foreground flex flex-row space-x-2 text-xs">
      <span data-testid="audio-player-position">
        {formatDuration(playbackPosition)}
      </span>
      <ProgressSlider
        playbackPosition={playbackPosition}
        duration={duration}
        seekTarget={seekTarget}
        setSeekTarget={setSeekTarget}
        setIsSeeking={setIsSeeking}
        seek={seek}
      />
      <span data-testid="audio-player-duration">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
