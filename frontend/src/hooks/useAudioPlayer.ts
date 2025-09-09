import { Howl } from "howler";
import { useCallback, useEffect, useReducer, useRef } from "react";

import type { Playable } from "@/types";

// TODO: centralize logging
const shouldLog = import.meta.env.MODE !== "production";

export type UseAudioPlayerResult = {
  state: AudioPlayerState;
  load: (v: Playable) => void;
  togglePlay: () => void;
  seek: (v: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const AudioPlayerStatus = {
  Idle: "idle",
  Loading: "loading",
  Playing: "playing",
  Paused: "paused",
  Error: "error",
} as const;

type AudioPlayerStatus =
  (typeof AudioPlayerStatus)[keyof typeof AudioPlayerStatus];

type AudioPlayerState = {
  status: AudioPlayerStatus;
  playable: Playable | null;
  duration: number;
  position: number;
  seekTarget: number;
  volume: number;
  isMuted: boolean;
  errorMessage: string;
};

const initialState: AudioPlayerState = {
  status: AudioPlayerStatus.Idle,
  playable: null,
  duration: 0,
  position: 0,
  seekTarget: 0,
  volume: 75,
  isMuted: false,
  errorMessage: "",
};

type AudioPlayerAction =
  | { type: "LOADED"; duration: number }
  | { type: "LOAD"; playable: Playable }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SYNC_POSITION"; position: number }
  | { type: "SEEK"; target: number }
  | { type: "VOLUME_CHANGE"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_ERROR"; message: string };

type AudioPlayerActionType = AudioPlayerAction["type"];

const allowedActions: Record<AudioPlayerStatus, AudioPlayerActionType[]> = {
  [AudioPlayerStatus.Idle]: ["LOAD"],
  [AudioPlayerStatus.Loading]: ["LOAD", "LOADED", "SET_ERROR"],
  [AudioPlayerStatus.Playing]: [
    "LOAD",
    "PAUSE",
    "SYNC_POSITION",
    "SEEK",
    "VOLUME_CHANGE",
    "TOGGLE_MUTE",
    "SET_ERROR",
  ],
  [AudioPlayerStatus.Paused]: [
    "LOAD",
    "PLAY",
    "SYNC_POSITION",
    "SEEK",
    "VOLUME_CHANGE",
    "TOGGLE_MUTE",
    "SET_ERROR",
  ],
  [AudioPlayerStatus.Error]: ["LOAD"],
};

function audioPlayerReducer(
  state: AudioPlayerState,
  action: AudioPlayerAction,
): AudioPlayerState {
  if (shouldLog) console.log("AudioPlayerAction", action);
  if (!allowAction(state.status, action.type)) {
    if (shouldLog) {
      console.warn(
        `AudioPlayer: action ${action.type} not allowed in status ${state.status}`,
      );
    }
    return state;
  }
  switch (action.type) {
    case "LOAD": {
      if (state.playable?.id === action.playable.id) {
        return state;
      }
      return {
        ...initialState,
        status: AudioPlayerStatus.Loading,
        playable: action.playable,
      };
    }
    case "LOADED": {
      return {
        ...state,
        status: AudioPlayerStatus.Paused,
        position: 0,
        duration: action.duration,
      };
    }
    case "PLAY": {
      return {
        ...state,
        status: AudioPlayerStatus.Playing,
      };
    }
    case "PAUSE": {
      return {
        ...state,
        status: AudioPlayerStatus.Paused,
      };
    }
    case "SYNC_POSITION": {
      return {
        ...state,
        position: action.position,
      };
    }
    case "SEEK": {
      return {
        ...state,
        seekTarget: action.target,
      };
    }
    case "VOLUME_CHANGE": {
      return {
        ...state,
        volume: action.volume,
      };
    }
    case "TOGGLE_MUTE": {
      return {
        ...state,
        isMuted: !state.isMuted,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        status: AudioPlayerStatus.Error,
        errorMessage: action.message,
      };
    }
  }
}

function allowAction(
  status: AudioPlayerStatus,
  actionType: AudioPlayerActionType,
): boolean {
  return allowedActions[status].includes(actionType);
}

export function useAudioPlayer(): UseAudioPlayerResult {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState);
  const howlRef = useRef<Howl | null>(null);

  const load = useCallback((playable: Playable) => {
    dispatch({ type: "LOAD", playable });
  }, []);

  const togglePlay = useCallback(() => {
    switch (state.status) {
      case AudioPlayerStatus.Playing: {
        dispatch({ type: "PAUSE" });
        return;
      }
      case AudioPlayerStatus.Paused: {
        dispatch({ type: "PLAY" });
        return;
      }
    }
  }, [state.status]);

  const seek = useCallback(
    (v: number) => {
      const target = Math.max(0, Math.min(state.duration, v));
      dispatch({ type: "SEEK", target });
      dispatch({ type: "SYNC_POSITION", position: target });
    },
    [state.duration],
  );

  const toggleMute = useCallback(() => {
    dispatch({ type: "TOGGLE_MUTE" });
  }, []);

  const setVolume = useCallback((v: number) => {
    const nextVolume = Math.max(0, Math.min(100, v));
    dispatch({ type: "VOLUME_CHANGE", volume: nextVolume });
  }, []);

  // Load new playable
  useEffect(() => {
    if (!state.playable) return;

    howlRef.current = new Howl({
      src: [state.playable.url],
      onload: () => {
        const howl = howlRef.current;
        if (!howl) return;

        const duration = secondsToMs(howl.duration());
        dispatch({ type: "LOADED", duration });
        dispatch({ type: "PLAY" });
      },
      onloaderror: (_, error: unknown) => {
        const message = getAudioErrorMessage(error);
        dispatch({ type: "SET_ERROR", message: message });
      },
      onplayerror: (_, error: unknown) => {
        const message = getAudioErrorMessage(error);
        dispatch({ type: "SET_ERROR", message: message });
      },
    });

    return () => {
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [state.playable]);

  // Play / Pause
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    switch (state.status) {
      case AudioPlayerStatus.Playing: {
        howl.play();
        return;
      }
      case AudioPlayerStatus.Paused: {
        howl.pause();
        return;
      }
    }
  }, [state.status]);

  // Seek
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.seek(msToSeconds(state.seekTarget));
  }, [state.seekTarget]);

  // Sync position
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (state.status !== AudioPlayerStatus.Playing) return;

    const syncPosition = () => {
      const position = secondsToMs(howl.seek());
      dispatch({ type: "SYNC_POSITION", position });
    };

    const intervalId = setInterval(syncPosition, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.status]);

  // Mute
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.mute(state.isMuted);
  }, [state.isMuted]);

  // Volume
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.volume(percentToFactor(state.volume));
  }, [state.volume]);

  return {
    state,
    load,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  };
}

function msToSeconds(ms: number) {
  return ms / 1000;
}
function secondsToMs(seconds: number) {
  return Math.round(seconds * 1000);
}

function percentToFactor(percent: number) {
  return percent / 100;
}

function getAudioErrorMessage(error: unknown): string {
  if (shouldLog) console.error("Audio playback error:", error);
  if (typeof error === "number") {
    switch (error) {
      case 1:
        return "The audio stopped loading before it could play.";
      case 2:
        return "A network error occured. Please check your connection.";
      case 3:
      case 4:
        return "The audio can't be played.";
    }
  }
  return "The audio can't be played right now.";
}
