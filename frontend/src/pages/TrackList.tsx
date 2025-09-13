import { Play } from "lucide-react";
import { type JSX } from "react";

import { Button } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
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
        {tracks.map((track, index) => (
          <li key={track.id} data-testid="track-item">
            <TrackItem
              track={track}
              number={index + 1}
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
  onPlay: () => void;
};

function TrackItem({ track, number, onPlay }: TrackItemProps): JSX.Element {
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
        <span className="truncate font-medium">{track.title}</span>
        <span className="text-muted-foreground text-sm">
          {formatDuration(track.duration)}
          {track.recordedDate && (
            <span> • {track.recordedDate.toLocaleDateString()}</span>
          )}
        </span>
      </div>

      <div>
        <Button
          onClick={onPlay}
          className="rounded-full p-2"
          variant="ghost"
          aria-label="Play track {track.title}"
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
