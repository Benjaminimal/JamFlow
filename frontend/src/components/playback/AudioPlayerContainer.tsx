import { type JSX, type ReactNode } from "react";

import {
  MuteToggle,
  PlayToggle,
  ProgressBar,
  VolumeSlider,
} from "@/components/playback";
import { usePlaybackContext } from "@/contexts/playback";

export default function AudioPlayerContainer(): JSX.Element | null {
  const { derived } = usePlaybackContext();

  if (derived.isIdle) return null;

  return (
    <AudioPlayerLayout>
      <AudioPlayerStateSwitcher />
    </AudioPlayerLayout>
  );
}
function AudioPlayerLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    //  TODO: remove debug styling
    <div
      style={{
        position: "fixed",
        width: "100%",
        left: 0,
        bottom: 0,
        zIndex: 1000,
        borderTop: "2px solid #000",
      }}
    >
      {children}
    </div>
  );
}

function AudioPlayerStateSwitcher() {
  const { derived } = usePlaybackContext();
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
      <div data-testid="audio-player-title">{playable?.title || ""}</div>
      <div>
        <ProgressBar />
        <div>
          <PlayToggle />
          <MuteToggle />
        </div>
        <VolumeSlider />
      </div>
    </div>
  );
}
