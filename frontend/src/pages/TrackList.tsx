import type { JSX } from "react";

import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import type { Track } from "@/types";

export default function TrackList(): JSX.Element {
  const { tracks, loading, errorMessage, fetchData } = useTrackList();

  // TODO: Add a skeleton loader for LoadingState when working on styling.
  const LoadingState = () => <p>Loading...</p>;

  const ErrorState = () => (
    <>
      <p>{errorMessage}</p>
      <button onClick={fetchData}>Retry</button>
    </>
  );

  const EmptyState = () => <p>No tracks found</p>;

  const TrackItem = ({ track }: { track: Track }) => (
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

  const LoadedState = () => (
    <>
      <ul data-testid="track-list">
        {tracks.map((track) => (
          <li key={track.id} data-testid="track-item">
            <TrackItem track={track} />
          </li>
        ))}
      </ul>
    </>
  );

  if (loading) return <LoadingState />;
  if (errorMessage) return <ErrorState />;
  if (tracks.length === 0) return <EmptyState />;
  return <LoadedState />;
}
