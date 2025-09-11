import { type JSX } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import type { Track } from "@/types";

export default function TrackList(): JSX.Element {
  const { tracks, isLoading, errorMessage, fetchData } = useTrackList();
  const {
    actions: { load },
  } = usePlaybackContext();

  const isError = errorMessage !== null;

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={errorMessage} onRetry={fetchData} />;
  if (tracks.length === 0) return <EmptyState />;
  return <LoadedState tracks={tracks} playTrack={load} />;
}

// TODO: Add a skeleton loader for LoadingState when working on styling.
function LoadingState(): JSX.Element {
  return <p>Loading...</p>;
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function ErrorState({ message, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <>
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </>
  );
}

function EmptyState(): JSX.Element {
  return <p>No tracks found</p>;
}

type LoadedStateProps = {
  tracks: Track[];
  playTrack: (v: Track) => void;
};

function LoadedState({ tracks, playTrack }: LoadedStateProps): JSX.Element {
  return (
    <>
      <ul data-testid="track-list">
        {tracks.map((track) => (
          <li key={track.id} data-testid="track-item">
            <TrackItem track={track} onPlay={() => playTrack(track)} />
          </li>
        ))}
      </ul>
    </>
  );
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
