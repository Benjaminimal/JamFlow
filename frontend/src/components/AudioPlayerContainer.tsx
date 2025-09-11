import { type JSX, useEffect, useRef, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback/PlaybackContext";
import { PlaybackStatus } from "@/contexts/playback/types";
import { formatDuration } from "@/lib/time";

export default function AudioPlayerContainer(): JSX.Element | null {
  const { state, actions } = usePlaybackContext();
  const { status, playable, volume, isMuted, errorMessage } = state;
  const { load, play, pause, setVolume, mute, unmute } = actions;

  const isActive = status !== "idle";
  const isError = status === "error";
  const isLoading = status === "loading";
  const isPlaying = status === "playing";

  if (!isActive) return null;

  const renderPlayerState = () => {
    if (isError)
      return (
        <ErrorDisplay
          message={errorMessage}
          onRetry={() => playable && load(playable)}
        />
      );
    if (isLoading) return <Loader />;
    return (
      <AudioPlayer
        title={playable?.title || ""}
        volume={volume}
        onVolumeChange={setVolume}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        isMuted={isMuted}
        onMute={mute}
        onUnmute={unmute}
      />
    );
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

function ErrorDisplay({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): JSX.Element {
  return (
    <>
      <p>{message}</p>
      <button onClick={onRetry} aria-label="retry">
        Retry
      </button>
    </>
  );
}

function Loader(): JSX.Element {
  return <p>Loading...</p>;
}

type AudioPlayerProps = {
  title: string;
  volume: number;
  onVolumeChange: (v: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  isMuted: boolean;
  onMute: () => void;
  onUnmute: () => void;
};

function AudioPlayer({
  title,
  volume,
  onVolumeChange,
  isPlaying,
  onPlay,
  onPause,
  isMuted,
  onMute,
  onUnmute,
}: AudioPlayerProps): JSX.Element {
  return (
    <div data-testid="audio-player">
      <div data-testid="audio-player-title">{title}</div>
      <div>
        <ProgressBar />
        <div>
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "pause" : "play"}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={isMuted ? onUnmute : onMute}
            aria-label={isMuted ? "unmute" : "mute"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => {
            onVolumeChange(Number(e.target.value));
          }}
          aria-label="change volume"
        />
      </div>
    </div>
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
