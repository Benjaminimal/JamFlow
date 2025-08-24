import type { JSX } from "react";

import { formatDuration } from "@/lib/time";
import type { Track } from "@/types";

type TrackProps = {
  track: Track;
};

export default function TrackItem({ track }: TrackProps): JSX.Element {
  return (
    <>
      <p>{track.title}</p>
      <p data-testid={`track-${track.id}-duration`}>
        {formatDuration(track.duration)}
      </p>
      {track.recordedDate && (
        <p data-testid={`track-${track.id}-date`}>
          {track.recordedDate.toLocaleDateString()}
        </p>
      )}
    </>
  );
}
