import { type JSX } from "react";

import { PlaybackToggle } from "@/components/playback";
import { Loader, PlayButton } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Track } from "@/types";

export function TrackList(): JSX.Element {
  const { tracks, isLoading, errorMessage, fetchData } = useTrackList();
  const {
    state: { playable },
    actions: { load },
  } = usePlaybackContext();

  const isError = errorMessage !== null;

  if (isLoading) return <Loader />;
  if (isError) return <ErrorState message={errorMessage} onRetry={fetchData} />;
  if (tracks.length === 0) return <EmptyState />;
  return (
    <LoadedState tracks={tracks} currentTrack={playable} playTrack={load} />
  );
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
  currentTrack: Track | null;
  playTrack: (v: Track) => void;
};

function LoadedState({
  tracks,
  currentTrack,
  playTrack,
}: LoadedStateProps): JSX.Element {
  return (
    <>
      <ul data-testid="track-list">
        {tracks.map((track, index) => (
          <li key={track.id} data-testid="track-item">
            <TrackItem
              track={track}
              number={index + 1}
              // NOTE: this check is not future proof for playing clips
              // we could make the playback context expose a predicate
              isCurrent={track.id === currentTrack?.id}
              onPlay={() => playTrack(track)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

type TrackItemProps = {
  track: Track;
  number: number;
  isCurrent?: boolean;
  onPlay: () => void;
};

function TrackItem({
  track,
  number,
  isCurrent,
  onPlay,
}: TrackItemProps): JSX.Element {
  const currentTrackClasses = isCurrent && "text-accent font-semibold";

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        "border-b-muted border-b",
        "hover:bg-muted active:bg-muted",
      )}
    >
      <div className="text-muted-foreground w-7 text-center text-sm">
        {number}
      </div>

      <div className="mx-2 flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate font-medium", currentTrackClasses)}>
          {track.title}
        </span>
        <span className="text-muted-foreground text-sm">
          {formatDuration(track.duration)}
          {track.recordedDate && (
            <span> • {track.recordedDate.toLocaleDateString()}</span>
          )}
        </span>
      </div>

      <div>
        {isCurrent ? (
          <PlaybackToggle className={cn(currentTrackClasses)} />
        ) : (
          <PlayButton onClick={onPlay} />
        )}
      </div>
    </div>
  );
}
