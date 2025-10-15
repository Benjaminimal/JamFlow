import { Howl } from "howler";
import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  type Playable,
  type PlaybackContextType,
  type PlaybackEvent,
  type PlaybackEventCallback,
  type PlaybackState,
  PlaybackStatus,
} from "@/contexts/playback/types";
import { isSamePlayable } from "@/contexts/playback/utils";
import { getLogger } from "@/lib/logging";

const logger = getLogger("usePlayback");

const initialState: PlaybackState = {
  status: PlaybackStatus.Idle,
  playable: null,
  duration: 0,
  seekTarget: 0,
  seekRequestId: 0,
  volume: 75,
  isMuted: false,
  isLooping: false,
  errorMessage: "",
};

type PlaybackAction =
  | { type: "LOADED"; duration: number }
  | { type: "LOAD"; playable: Playable }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SEEK"; target: number }
  | { type: "VOLUME_CHANGE"; volume: number }
  | { type: "MUTE" }
  | { type: "UNMUTE" }
  | { type: "LOOP" }
  | { type: "UNLOOP" }
  | { type: "SET_ERROR"; message: string };

type PlaybackActionType = PlaybackAction["type"];

const allowedActions: Record<PlaybackStatus, PlaybackActionType[]> = {
  [PlaybackStatus.Idle]: ["LOAD"],
  [PlaybackStatus.Loading]: ["LOAD", "LOADED", "SET_ERROR"],
  [PlaybackStatus.Playing]: [
    "LOAD",
    "PAUSE",
    "SEEK",
    "VOLUME_CHANGE",
    "MUTE",
    "UNMUTE",
    "LOOP",
    "UNLOOP",
    "SET_ERROR",
  ],
  [PlaybackStatus.Paused]: [
    "LOAD",
    "PLAY",
    "SEEK",
    "VOLUME_CHANGE",
    "MUTE",
    "UNMUTE",
    "LOOP",
    "UNLOOP",
    "SET_ERROR",
  ],
  [PlaybackStatus.Error]: ["LOAD"],
};

function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  logger.info("PlaybackAction", action);
  if (!allowAction(state.status, action.type)) {
    logger.warn(
      `Playback: action ${action.type} not allowed in status ${state.status}`,
    );
    return state;
  }
  switch (action.type) {
    case "LOAD": {
      if (isSamePlayable(state.playable, action.playable)) {
        return state;
      }
      return {
        ...initialState,
        status: PlaybackStatus.Loading,
        playable: action.playable,
      };
    }
    case "LOADED": {
      return {
        ...state,
        status: PlaybackStatus.Paused,
        duration: action.duration,
      };
    }
    case "PLAY": {
      return {
        ...state,
        status: PlaybackStatus.Playing,
      };
    }
    case "PAUSE": {
      return {
        ...state,
        status: PlaybackStatus.Paused,
      };
    }
    case "SEEK": {
      return {
        ...state,
        seekTarget: action.target,
        seekRequestId: state.seekRequestId + 1,
      };
    }
    case "VOLUME_CHANGE": {
      return {
        ...state,
        volume: action.volume,
      };
    }
    case "MUTE": {
      return {
        ...state,
        isMuted: true,
      };
    }
    case "UNMUTE": {
      return {
        ...state,
        isMuted: false,
      };
    }
    case "LOOP": {
      return {
        ...state,
        isLooping: true,
      };
    }
    case "UNLOOP": {
      return {
        ...state,
        isLooping: false,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        status: PlaybackStatus.Error,
        errorMessage: action.message,
      };
    }
  }
}

function allowAction(
  status: PlaybackStatus,
  actionType: PlaybackActionType,
): boolean {
  return allowedActions[status].includes(actionType);
}

export function usePlayback(): PlaybackContextType {
  const [state, dispatch] = useReducer(playbackReducer, initialState);

  const howlRef = useRef<Howl | null>(null);
  const subscribersRef = useRef<Set<PlaybackEventCallback>>(new Set());

  const isIdle = state.status === PlaybackStatus.Idle;
  const isLoading = state.status === PlaybackStatus.Loading;
  const isPlaying = state.status === PlaybackStatus.Playing;
  const isPaused = state.status === PlaybackStatus.Paused;
  const isError = state.status === PlaybackStatus.Error;

  const subscribe = useCallback((callback: PlaybackEventCallback) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  const emit = useCallback((event: PlaybackEvent) => {
    subscribersRef.current.forEach((callback) => callback(event));
  }, []);

  const load = useCallback((playable: Playable) => {
    dispatch({ type: "LOAD", playable });
  }, []);

  const play = useCallback(() => {
    dispatch({ type: "PLAY" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const getPosition = useCallback((): number => {
    const howl = howlRef.current;
    if (!howl) return 0;
    return secondsToMs(howl.seek());
  }, []);

  const seek = useCallback(
    (rawTarget: number) => {
      const target = Math.max(0, Math.min(state.duration, rawTarget));
      dispatch({ type: "SEEK", target });
    },
    [state.duration],
  );

  const setVolume = useCallback((rawVolume: number) => {
    const nextVolume = Math.max(0, Math.min(100, rawVolume));
    dispatch({ type: "VOLUME_CHANGE", volume: nextVolume });
  }, []);

  const mute = useCallback(() => {
    dispatch({ type: "MUTE" });
  }, []);

  const unmute = useCallback(() => {
    dispatch({ type: "UNMUTE" });
  }, []);

  const loop = useCallback(() => {
    dispatch({ type: "LOOP" });
  }, []);

  const unloop = useCallback(() => {
    dispatch({ type: "UNLOOP" });
  }, []);

  // Load new playable
  useEffect(() => {
    if (!state.playable) return;

    howlRef.current = new Howl({
      html5: true,
      src: [state.playable.url],
      onload: () => {
        const howl = howlRef.current;
        if (!howl) return;

        const duration = secondsToMs(howl.duration());
        dispatch({ type: "LOADED", duration });
        dispatch({ type: "PLAY" });
      },
      onloaderror: (_, error: unknown) => {
        logger.error("Audio load error:", error);
        const message = getAudioErrorMessage(error);
        dispatch({ type: "SET_ERROR", message: message });
      },
      onplayerror: (_, error: unknown) => {
        logger.error("Audio play error:", error);

        // Some browsers require user interaction before playing audio
        // This is a workaround to that issue
        // https://github.com/goldfire/howler.js?tab=readme-ov-file#mobilechrome-playback
        if (isPlaybackLockedByBrowser(error) && howlRef.current) {
          dispatch({ type: "PAUSE" });
          howlRef.current.once("unlock", () => {
            dispatch({ type: "PLAY" });
          });
          return;
        }

        const message = getAudioErrorMessage(error);
        dispatch({ type: "SET_ERROR", message: message });
      },
      onend: () => {
        const howl = howlRef.current;
        if (!howl) return;

        if (!howl.loop()) {
          // Howler ends the playback automatically
          // so we need to keep the state in sync
          dispatch({ type: "PAUSE" });
        }
      },
    });

    return () => {
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [state.playable]);

  // Progress
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      emit({ type: "progress", position: getPosition() });
      requestAnimationFrame(tick);
    };

    const rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, emit, getPosition]);

  // Play / Pause
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    switch (state.status) {
      case PlaybackStatus.Playing: {
        howl.play();
        return;
      }
      case PlaybackStatus.Paused: {
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
    emit({ type: "seek", target: state.seekTarget });
  }, [state.seekTarget, state.seekRequestId, emit]);

  // Volume
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.volume(percentToFactor(state.volume));
  }, [state.volume]);

  // Mute
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.mute(state.isMuted);
  }, [state.isMuted]);

  // Mute
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.loop(state.isLooping);
  }, [state.isLooping]);

  return {
    state,
    actions: {
      load,
      play,
      pause,
      getPosition,
      seek,
      setVolume,
      mute,
      unmute,
      loop,
      unloop,
      subscribe,
    },
    derived: {
      isIdle,
      isLoading,
      isPlaying,
      isPaused,
      isError,
    },
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

function isPlaybackLockedByBrowser(error: unknown): boolean {
  if (typeof error === "string") {
    return error
      .toLocaleLowerCase()
      .includes("playback was not within a user interaction");
  }
  return false;
}
