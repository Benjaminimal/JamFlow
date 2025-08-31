import { type JSX, useContext, useEffect } from "react";

import { PlayableContext } from "@/contexts/PlayableContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { formatDuration } from "@/lib/time";

export default function AudioPlayerController(): JSX.Element | null {
  const { playable } = useContext(PlayableContext);
  const {
    load,
    isActive,
    isLoading,
    title,
    duration,
    position,
    seek,
    volume,
    setVolume,
    isPlaying,
    togglePlay,
    isMuted,
    toggleMute,
    errorMessage,
  } = useAudioPlayer();

  useEffect(() => {
    if (playable) {
      load(playable);
    }
  }, [playable, load]);

  if (!isActive) return null;

  const renderPlayerState = () => {
    if (errorMessage)
      return (
        <ErrorDisplay
          message={errorMessage}
          onRetry={() => playable && load(playable)}
        />
      );
    if (isLoading) return <Loader />;
    return (
      <AudioPlayer
        title={title}
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
      <button onClick={onRetry}>Retry</button>
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
      <div>
        <span data-testid="audio-player-title">{title}</span>|
        <span data-testid="audio-player-position">
          {formatDuration(position)}
        </span>
        |
        <span data-testid="audio-player-duration">
          {formatDuration(duration)}
        </span>
      </div>
      <div>
        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={isPlaying ? "pause" : "play"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          value={position}
          onChange={(e) => {
            onPositionChange(Number(e.target.value));
          }}
          aria-label="seek position"
        />
        <button
          type="button"
          onClick={onMuteToggle}
          aria-label={isMuted ? "unmute" : "mute"}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
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
