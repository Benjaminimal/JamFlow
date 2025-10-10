import { type JSX, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PlaybackToggle } from "@/components/playback";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlayButton,
} from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { asTrack, isSameTrack } from "@/contexts/playback/utils";
import { useAutoloadPlayable } from "@/hooks/useAutoloadPlayable";
import { useTrackList } from "@/hooks/useTrackList";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { urlGenerator } from "@/routing";
import type { Track } from "@/types";

export function TrackList(): JSX.Element {
  const { tracks, isLoading, errorMessage, fetchData } = useTrackList();
  const {
    state: { playable },
    actions: { load },
  } = usePlaybackContext();

  const isError = errorMessage !== null;
  const currentTrack = asTrack(playable);

  const [searchParams, _] = useSearchParams();
  const sharedTrackId = searchParams.get("sharedTrackId") || undefined;
  const { errorMessage: autoloadError } = useAutoloadPlayable(
    "track",
    sharedTrackId,
  );

  useEffect(() => {
    if (autoloadError) {
      toast.error(autoloadError);
    }
  }, [autoloadError]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={errorMessage} onRetry={fetchData} />;
  if (tracks.length === 0) return <EmptyState />;
  return (
    <LoadedState tracks={tracks} currentTrack={currentTrack} playTrack={load} />
  );
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
              isCurrent={isSameTrack(track, currentTrack)}
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
      <Link
        to={urlGenerator.trackDetail({ id: track.id })}
        state={{ track }}
        className="group flex min-w-0 flex-1 items-center"
      >
        <div className="text-muted-foreground w-7 text-center text-sm">
          {number}
        </div>

        <div className="mx-2 flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate font-medium",
              "group-hover:underline group-active:underline",
              currentTrackClasses,
            )}
          >
            {track.title}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatDuration(track.duration)}
            {track.recordedDate && (
              <span> • {track.recordedDate.toLocaleDateString()}</span>
            )}
          </span>
        </div>
      </Link>

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
