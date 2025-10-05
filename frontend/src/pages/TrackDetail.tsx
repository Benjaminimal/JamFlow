import type { JSX, ReactNode } from "react";

import { PlaybackToggle } from "@/components/playback";
import { H2, H3 } from "@/components/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlayButton,
} from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { isSamePlayable } from "@/contexts/playback/utils";
import { useClipList } from "@/hooks/useClipList";
import { useTrack } from "@/hooks/useTrack";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { trackDetailRoute } from "@/routes";
import type { Clip, Track } from "@/types";

export type TrackDetailParams = Pick<Track, "id">;

export function TrackDetail(): JSX.Element {
  const { id } = trackDetailRoute.useParams();
  console.log("TrackDetail render", { id });

  const {
    track,
    isLoading: trackLoading,
    errorMessage: trackErrorMessage,
    fetchData: fetchTrack,
  } = useTrack(id);
  console.log("useTrack", { track, trackLoading, trackErrorMessage });

  const {
    clips,
    isLoading: clipsLoading,
    errorMessage: clipsErrorMessage,
    fetchData: fetchClips,
  } = useClipList(id);

  if (!track && trackLoading) return <LoadingState />;
  if (!track && trackErrorMessage)
    return <ErrorState message={trackErrorMessage} onRetry={fetchTrack} />;
  if (!track) return <LoadingState />;
  return (
    <div className="space-y-4">
      <TrackHeader track={track} />
      <ClipsSection>
        <ClipListContent
          clips={clips}
          isLoading={clipsLoading}
          errorMessage={clipsErrorMessage}
          fetchData={fetchClips}
        />
      </ClipsSection>
    </div>
  );
}

type TrackHeaderProps = {
  track: Track;
};

function TrackHeader({ track }: TrackHeaderProps): JSX.Element {
  return (
    <div className="border-accent-foreground border-b py-4 text-center">
      <H2>{track.title}</H2>
    </div>
  );
}

type ClipsSectionProps = {
  children: ReactNode;
};

function ClipsSection({ children }: ClipsSectionProps): JSX.Element {
  return (
    <div>
      <H3 className="mb-2">Clips</H3>
      {children}
    </div>
  );
}

type ClipListContentProps = {
  clips: Clip[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchData: () => void;
};

function ClipListContent({
  clips,
  isLoading,
  errorMessage,
  fetchData,
}: ClipListContentProps): JSX.Element {
  if (isLoading) return <LoadingState />;
  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={fetchData} />;
  if (clips.length === 0) return <EmptyState />;
  return <ClipList clips={clips} />;
}

type ClipListProps = {
  clips: Clip[];
};

function ClipList({ clips }: ClipListProps): JSX.Element {
  return (
    <ul className="flex flex-col gap-2">
      {clips.map((clip) => (
        <li key={clip.id}>
          <ClipItem clip={clip} />
        </li>
      ))}
    </ul>
  );
}

type ClipItemProps = {
  clip: Clip;
};

function ClipItem({ clip }: ClipItemProps): JSX.Element {
  const {
    state: { playable },
    actions: { load },
  } = usePlaybackContext();

  const isCurrent = isSamePlayable(clip, playable);
  const currentClipClasses = isCurrent && "text-accent font-semibold";

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        "border-b-muted border-b",
        "hover:bg-muted active:bg-muted",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <div className="mx-2 flex min-w-0 flex-1 flex-col">
          <span className={cn("truncate font-medium", currentClipClasses)}>
            {clip.title}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatDuration(clip.start)}
            {" - "}
            {formatDuration(clip.end)}
            {" ["}
            {formatDuration(clip.duration)}
            {"]"}
          </span>
        </div>
      </div>

      <div>
        {isCurrent ? (
          <PlaybackToggle className={cn(currentClipClasses)} />
        ) : (
          <PlayButton
            onClick={() => {
              load(clip);
            }}
          />
        )}
      </div>
    </div>
  );
}
