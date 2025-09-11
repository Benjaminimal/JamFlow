import { type JSX, useEffect, useRef, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback/PlaybackContext";
import { PlaybackStatus } from "@/contexts/playback/types";
import { formatDuration } from "@/lib/time";

export default function AudioPlayerContainer(): JSX.Element | null {
  const {
    state: { status },
  } = usePlaybackContext();

  const isActive = status !== PlaybackStatus.Idle;
  const isError = status === PlaybackStatus.Error;
  const isLoading = status === PlaybackStatus.Loading;

  if (!isActive) return null;

  const renderPlayerState = () => {
    if (isError) return <ErrorDisplay />;
    if (isLoading) return <Loader />;
    return <AudioPlayer />;
  };

  return (
    //  TODO: remove debug styling
    <div
      style={{
        position: "fixed",
        width: "100%",
        left: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: "#242424",
        borderTop: "2px solid #fff",
      }}
    >
      {renderPlayerState()}
    </div>
  );
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

function PlayToggle(): JSX.Element {
  const {
    state: { status },
    actions: { play, pause },
  } = usePlaybackContext();
  const isPlaying = status === PlaybackStatus.Playing;
  return (
    <button
      type="button"
      onClick={isPlaying ? pause : play}
      aria-label={isPlaying ? "pause" : "play"}
    ></button>
  );
}

function ProgressBar(): JSX.Element {
  const playback = usePlaybackContext();
  const { getPosition } = playback.actions;
  // TODO: we could try to replace this with the sliderRef value directly
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const spanRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (playback.state.status !== PlaybackStatus.Playing) return;

    let lastSpanUpdate = 0;
    const spanThrottle = 250; // milliseconds

    const syncProgress = () => {
      const progress = isSeeking ? seekTarget : getPosition();
      if (sliderRef.current) {
        sliderRef.current.value = String(progress);
      }
      if (
        spanRef.current &&
        (isSeeking || Date.now() - lastSpanUpdate > spanThrottle)
      ) {
        spanRef.current.textContent = formatDuration(progress);
        lastSpanUpdate = Date.now();
      }
      requestAnimationFrame(syncProgress);
    };

    const refid = requestAnimationFrame(syncProgress);

    return () => cancelAnimationFrame(refid);
  }, [isSeeking, seekTarget, playback.state.status, getPosition]);

  return (
    <>
      <span ref={spanRef} data-testid="audio-player-position"></span>
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max={playback.state.duration}
        step={100}
        onPointerDown={() => setIsSeeking(true)}
        onPointerUp={() => {
          playback.actions.seek(seekTarget);
          setIsSeeking(false);
        }}
        onChange={(e) => setSeekTarget(Number(e.target.value))}
        aria-label="seek position"
      />
      <span data-testid="audio-player-duration">
        {formatDuration(playback.state.duration)}
      </span>
    </>
  );
}

function MuteToggle(): JSX.Element {
  const {
    state: { isMuted },
    actions: { mute, unmute },
  } = usePlaybackContext();
  return (
    <button
      type="button"
      onClick={isMuted ? mute : unmute}
      aria-label={isMuted ? "unmute" : "mute"}
    >
      {isMuted ? "Unmute" : "Mute"}
    </button>
  );
}

function VolumeSlider(): JSX.Element {
  const {
    state: { volume },
    actions: { setVolume },
  } = usePlaybackContext();
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={volume}
      onChange={(e) => {
        setVolume(Number(e.target.value));
      }}
      aria-label="change volume"
    />
  );
}
