import type { JSX, ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";

import { H2, H3 } from "@/components/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlayButton,
} from "@/components/ui";
import { useClipList } from "@/hooks/useClipList";
import { useTrack } from "@/hooks/useTrack";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Clip, Track } from "@/types";

export type TrackDetailParams = Pick<Track, "id">;

export function TrackDetail(): JSX.Element {
  const { id } = useParams<TrackDetailParams>();
  const location = useLocation();
  const passedTrack = location.state?.track as Track | undefined;

  const {
    track: fetchedTrack,
    isLoading: trackLoading,
    errorMessage: trackErrorMessage,
    fetchData: fetchTrack,
  } = useTrack(passedTrack ? undefined : id);

  const {
    clips,
    isLoading: clipsLoading,
    errorMessage: clipsErrorMessage,
    fetchData: fetchClips,
  } = useClipList(id);

  const track = passedTrack ?? fetchedTrack;

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
          <span className="truncate font-medium">{clip.title}</span>
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

      <PlayButton />
    </div>
  );
}
