import type { JSX } from "react";

import { formatDuration } from "@/lib/time";
import type { Track } from "@/types";

type TrackItemProps = {
  track: Track;
  onPlay: () => void;
};

export default function TrackItem({
  track,
  onPlay,
}: TrackItemProps): JSX.Element {
  return (
    <div onClick={onPlay}>
      <p>{track.title}</p>
      <p data-testid={`track-${track.id}-duration`}>
        {formatDuration(track.duration)}
      </p>
      {track.recordedDate && (
        <p data-testid={`track-${track.id}-date`}>
          {track.recordedDate.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
