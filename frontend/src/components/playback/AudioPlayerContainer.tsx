import { type JSX } from "react";

import {
  MuteToggle,
  PlaybackToggle,
  ProgressBar,
  VolumeSlider,
} from "@/components/playback";
import { usePlaybackContext } from "@/contexts/playback";

export default function AudioPlayerContainer(): JSX.Element | null {
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

function Loader(): JSX.Element {
  return <p>Loading...</p>;
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
      <div className="flex flex-row items-center justify-center space-x-8 py-4">
        <div className="flex flex-row items-center space-x-4">
          <VolumeSlider />
          <MuteToggle />
        </div>
        <PlaybackToggle />
        <div>PLACEHOLDER</div>
      </div>
    </div>
  );
}
