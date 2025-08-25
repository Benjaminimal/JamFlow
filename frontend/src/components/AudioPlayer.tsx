import type { JSX } from "react";

import { formatDuration } from "@/lib/time";

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
export default function AudioPlayer({
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
