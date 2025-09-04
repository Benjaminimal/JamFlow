import { type JSX } from "react";

import { usePlaybackContext } from "@/contexts/PlaybackContext";
import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import type { Track } from "@/types";

// TODO: pull the inner components out and pass props
export default function TrackList(): JSX.Element {
  const { tracks, isLoading, errorMessage, fetchData } = useTrackList();
  const { setCurrentPlayable } = usePlaybackContext();

  const isError = errorMessage !== null;

  // TODO: Add a skeleton loader for LoadingState when working on styling.
  const LoadingState = () => <p>Loading...</p>;

  const ErrorState = () => (
    <>
      <p>{errorMessage}</p>
      <button onClick={fetchData}>Retry</button>
    </>
  );

  const EmptyState = () => <p>No tracks found</p>;

  const LoadedState = () => (
    <>
      <ul data-testid="track-list">
        {tracks.map((track) => (
          <li key={track.id} data-testid="track-item">
            <TrackItem track={track} onPlay={() => setCurrentPlayable(track)} />
          </li>
        ))}
      </ul>
    </>
  );

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (tracks.length === 0) return <EmptyState />;
  return <LoadedState />;
}

type TrackItemProps = {
  track: Track;
  onPlay: () => void;
};

function TrackItem({ track, onPlay }: TrackItemProps): JSX.Element {
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
