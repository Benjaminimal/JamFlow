import type { Track } from "@/types";

// TODO: explicitly declare only what is strictly needed here
// Track has too many fields that are not necessary for playback
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
  isLooping: boolean;
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
  loop: () => void;
  unloop: () => void;
  subscribe: (cb: PlaybackEventCallback) => PlaybackEventUnsubscribe;
};

export type PlaybackDerived = {
  isIdle: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isError: boolean;
};

export type PlaybackContextType = {
  state: PlaybackState;
  actions: PlaybackActions;
  derived: PlaybackDerived;
};

export type PlaybackEventCallback = (e: PlaybackEvent) => void;

export type PlaybackEventUnsubscribe = () => void;

export type PlaybackEvent =
  | { type: "seek"; target: number }
  | { type: "progress"; position: number };
