import { X } from "lucide-react";
import { type JSX } from "react";

import { ClipperControls } from "@/components/clipper";
import {
  AudioPlayer,
  PlaybackToggle,
  ProgressBar,
} from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { ErrorState, LoadingState } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { useClipper, type UseClipperResult } from "@/hooks/useClipper";

export function AudioPlayerContainer(): JSX.Element | null {
  const { derived } = usePlaybackContext();
  const clipper = useClipper();

  if (derived.isIdle) return null;
  if (derived.isError) return <ErrorDisplay />;
  if (derived.isLoading) return <LoadingState />;
  if (clipper.derived.isActive) return <Clipper clipper={clipper} />;
  return <AudioPlayer clipper={clipper} />;
}

function ErrorDisplay(): JSX.Element {
  const {
    state: { errorMessage, playable },
    actions: { load },
  } = usePlaybackContext();
  return (
    <ErrorState
      message={errorMessage}
      onRetry={() => playable && load(playable)}
    />
  );
}

type ClipperProps = {
  clipper: UseClipperResult;
};

function Clipper({ clipper }: ClipperProps): JSX.Element {
  const {
    state: { playable, duration },
  } = usePlaybackContext();

  return (
    <div data-testid="clipper" className="flex flex-col space-y-4">
      <div className="text-center font-medium" data-testid="audio-player-title">
        {playable?.title || ""}
        <IconButton icon={X} onClick={clipper.actions.cancelClipping} />
      </div>
      <div className="space-y-2">
        <ClipperControls
          clipStart={clipper.state.start}
          clipEnd={clipper.state.end}
          setStart={clipper.actions.setStart}
          setEnd={clipper.actions.setEnd}
          clampStart={clipper.utils.clampStart}
          clampEnd={(e, s) => clipper.utils.clampEnd(e, s, duration)}
        />
        <ProgressBar />
      </div>
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="ml-1 flex flex-row items-center space-x-2">P</div>
        <PlaybackToggle
          className="rounded-full border-2 !border-current"
          size="icon-lg"
          variant="outline"
        />
        <div className="mr-1 flex flex-row items-center space-x-2">P</div>
      </div>
    </div>
  );
}
