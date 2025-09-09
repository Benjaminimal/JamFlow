import { type JSX, useEffect, useState } from "react";

import { usePlayback } from "@/contexts/PlaybackContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { formatDuration } from "@/lib/time";

export default function AudioPlayerContainer(): JSX.Element | null {
  const { currentPlayable } = usePlayback();
  const { state, load, togglePlay, seek, setVolume, toggleMute } =
    useAudioPlayer();
  const {
    status,
    playable,
    duration,
    position,
    volume,
    isMuted,
    errorMessage,
  } = state;

  const isActive = status !== "idle";
  const isError = status === "error";
  const isLoading = status === "loading";
  const isPlaying = status === "playing";

  useEffect(() => {
    if (currentPlayable) {
      load(currentPlayable);
    }
  }, [currentPlayable, load]);

  if (!isActive) return null;

  const renderPlayerState = () => {
    if (isError)
      return (
        <ErrorDisplay
          message={errorMessage}
          onRetry={() => currentPlayable && load(currentPlayable)}
        />
      );
    if (isLoading) return <Loader />;
    return (
      <AudioPlayer
        title={playable?.title || ""}
        duration={duration}
        position={position}
        onPositionChange={seek}
        volume={volume}
        onVolumeChange={setVolume}
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
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
  duration: number;
  position: number;
  onPositionChange: (v: number) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
};

function AudioPlayer({
  title,
  duration,
  position,
  onPositionChange,
  volume,
  onVolumeChange,
  isPlaying,
  onPlayToggle,
  isMuted,
  onMuteToggle,
}: AudioPlayerProps): JSX.Element {
  return (
    <div data-testid="audio-player">
      <div data-testid="audio-player-title">{title}</div>
      <div>
        <ProgressBar
          duration={duration}
          position={position}
          onPositionChange={onPositionChange}
        />
        <div>
          <button
            type="button"
            onClick={onPlayToggle}
            aria-label={isPlaying ? "pause" : "play"}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={onMuteToggle}
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

type ProgressBarProps = {
  duration: number;
  position: number;
  onPositionChange: (v: number) => void;
};

function ProgressBar({
  duration,
  position,
  onPositionChange,
}: ProgressBarProps): JSX.Element {
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  return (
    <>
      <span data-testid="audio-player-position">
        {formatDuration(isSeeking ? seekTarget : position)}
      </span>
      <input
        type="range"
        min="0"
        max={duration}
        value={isSeeking ? seekTarget : position}
        onPointerDown={() => {
          setIsSeeking(true);
        }}
        onPointerUp={() => {
          setIsSeeking(false);
          onPositionChange(seekTarget);
        }}
        onChange={(e) => {
          setSeekTarget(Number(e.target.value));
        }}
        aria-label="seek position"
      />
      <span data-testid="audio-player-duration">
        {formatDuration(duration)}
      </span>
    </>
  );
}
