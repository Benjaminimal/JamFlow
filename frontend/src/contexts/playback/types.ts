import type { Track } from "@/types";

export type Playable = Track;

export const PlaybackStatus = {
  Idle: "idle",
  Loading: "loading",
  Playing: "playing",
  Paused: "paused",
  Error: "error",
} as const;

export type PlaybackStatus =
  (typeof PlaybackStatus)[keyof typeof PlaybackStatus];

export type PlaybackState = {
  status: PlaybackStatus;
  playable: Playable | null;
  duration: number;
  seekTarget: number;
  volume: number;
  isMuted: boolean;
  errorMessage: string;
};

export type PlaybackActions = {
  load: (v: Playable) => void;
  play: () => void;
  pause: () => void;
  seek: (v: number) => void;
  getPosition: () => number;
  setVolume: (v: number) => void;
  mute: () => void;
  unmute: () => void;
};

export type PlaybackContextType = {
  state: PlaybackState;
  actions: PlaybackActions;
};
