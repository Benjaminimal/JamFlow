import type { JSX } from "react";

import { useTrackList } from "@/hooks/useTrackList";

export default function TrackList(): JSX.Element {
  const { tracks, loading, errorMessage, fetchData } = useTrackList();
  if (loading)
    return (
      <>
        <p>Loading...</p>
      </>
    );
  if (errorMessage) {
    return (
      <>
        <p>{errorMessage}</p>
        <button onClick={fetchData}>Retry</button>
      </>
    );
  }
  if (tracks.length === 0)
    return (
      <>
        <p>No tracks found</p>
      </>
    );
  return (
    <>
      <div>
        {tracks.map((track) => (
          <div key={track.id} data-testid="track-item">
            <p>{track.title}</p>
            <p data-testid={`track-${track.id}-duration`}>{track.duration}</p>
            {track.recordedDate && (
              <p data-testid={`track-${track.id}-date`}>
                {track.recordedDate.toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
