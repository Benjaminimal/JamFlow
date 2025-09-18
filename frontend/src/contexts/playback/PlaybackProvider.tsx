import { Howl } from "howler";
import {
  type JSX,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";

import { PlaybackContext } from "@/contexts/playback/PlaybackContext";
import {
  type Playable,
  type PlaybackContextType,
  type PlaybackState,
  PlaybackStatus,
} from "@/contexts/playback/types";
import { getLogger } from "@/lib/logging";

const logger = getLogger("PlaybackProvider");

const initialState: PlaybackState = {
  status: PlaybackStatus.Idle,
  playable: null,
  duration: 0,
  seekTarget: 0,
  volume: 75,
  isMuted: false,
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
    "SET_ERROR",
  ],
  [PlaybackStatus.Paused]: [
    "LOAD",
    "PLAY",
    "SEEK",
    "VOLUME_CHANGE",
    "MUTE",
    "UNMUTE",
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
      if (state.playable?.id === action.playable.id) {
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

function usePlayback(): PlaybackContextType {
  const [state, dispatch] = useReducer(playbackReducer, initialState);
  const howlRef = useRef<Howl | null>(null);

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
    (v: number) => {
      const target = Math.max(0, Math.min(state.duration, v));
      dispatch({ type: "SEEK", target });
    },
    [state.duration],
  );

  const setVolume = useCallback((v: number) => {
    const nextVolume = Math.max(0, Math.min(100, v));
    dispatch({ type: "VOLUME_CHANGE", volume: nextVolume });
  }, []);

  const mute = useCallback(() => {
    dispatch({ type: "MUTE" });
  }, []);

  const unmute = useCallback(() => {
    dispatch({ type: "UNMUTE" });
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
        const message = getAudioErrorMessage(error);
        dispatch({ type: "SET_ERROR", message: message });
      },
      // TODO: implement onend to correct the state
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
  }, [state.seekTarget]);

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
    actions: {
      load,
      play,
      pause,
      getPosition,
      seek,
      setVolume,
      mute,
      unmute,
    },
    derived: {
      isIdle: state.status === PlaybackStatus.Idle,
      isLoading: state.status === PlaybackStatus.Loading,
      isPlaying: state.status === PlaybackStatus.Playing,
      isPaused: state.status === PlaybackStatus.Paused,
      isError: state.status === PlaybackStatus.Error,
    },
  };
}

export function PlaybackProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const value = usePlayback();

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
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
