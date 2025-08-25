import { type JSX, useContext } from "react";

import TrackItem from "@/components/TrackItem";
import { AudioPlayerContext } from "@/contexts/AudioPlayerContext";
import { useTrackList } from "@/hooks/useTrackList";

export default function TrackList(): JSX.Element {
  const { tracks, loading, errorMessage, fetchData } = useTrackList();
  const { load } = useContext(AudioPlayerContext);

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
            <TrackItem track={track} onPlay={() => load(track)} />
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
