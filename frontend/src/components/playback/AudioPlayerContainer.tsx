import { type JSX } from "react";

import {
  MuteToggle,
  PlaybackToggle,
  ProgressBar,
  VolumeSlider,
} from "@/components/playback";
import { Loader } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";

export function AudioPlayerContainer(): JSX.Element | null {
  const { derived } = usePlaybackContext();

  if (derived.isIdle) return null;
  if (derived.isError) return <ErrorDisplay />;
  if (derived.isLoading) return <Loader />;
  return <AudioPlayer />;
}

function ErrorDisplay(): JSX.Element {
  const {
    state: { errorMessage, playable },
    actions: { load },
  } = usePlaybackContext();
  return (
    <>
      <p>{errorMessage}</p>
      <button onClick={() => playable && load(playable)} aria-label="retry">
        Retry
      </button>
    </>
  );
}

function AudioPlayer(): JSX.Element {
  const {
    state: { playable },
  } = usePlaybackContext();
  return (
    <div data-testid="audio-player">
      <div className="text-center font-medium" data-testid="audio-player-title">
        {playable?.title || ""}
      </div>
      <ProgressBar />
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="ml-1 flex flex-row items-center space-x-2">
          <VolumeSlider className="!min-h-9" orientation="vertical" />
          <MuteToggle />
        </div>
        <PlaybackToggle
          className="rounded-full border-2 !border-current"
          size="icon-lg"
          variant="outline"
        />
        <div className="mr-1 flex flex-row items-center space-x-2">
          {/* TODO: replace with clipper icon */}
          <MuteToggle />
          <span className="w-[6px]"></span>
        </div>
      </div>
    </div>
  );
}
