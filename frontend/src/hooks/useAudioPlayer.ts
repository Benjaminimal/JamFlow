import { Howl } from "howler";
import { useCallback, useEffect, useReducer, useRef } from "react";

import type { Playable } from "@/types";

const AudioPlayerStatus = {
  Idle: "idle",
  Loading: "loading",
  Playing: "playing",
  Paused: "paused",
  Error: "error",
} as const;

type AudioPlayerStatus =
  (typeof AudioPlayerStatus)[keyof typeof AudioPlayerStatus];

export type UseAudioPlayerResult = {
  state: AudioPlayerState;
  load: (v: Playable) => void;
  togglePlay: () => void;
  seek: (v: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

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

// TODO: consider adding guards for invalid state transitions
function audioPlayerReducer(
  state: AudioPlayerState,
  action: AudioPlayerAction,
): AudioPlayerState {
  console.log("AudioPlayerAction", action);
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

export function useAudioPlayer(): UseAudioPlayerResult {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState);
  const howlRef = useRef<Howl | null>(null);

  const load = useCallback((playable: Playable) => {
    dispatch({ type: "LOAD", playable });
  }, []);

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
    });

    return () => {
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [state.playable]);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, []);

  const togglePlay = () => {
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
  };

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

  // TODO: get rid of seek scrub
  const seek = (v: number) => {
    const target = Math.max(0, Math.min(state.duration, v));
    dispatch({ type: "SEEK", target });
  };

  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.seek(msToSeconds(state.seekTarget));
  }, [state.seekTarget]);

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

  const toggleMute = () => dispatch({ type: "TOGGLE_MUTE" });

  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.mute(state.isMuted);
  }, [state.isMuted]);

  const setVolume = (v: number) => {
    const nextVolume = Math.max(0, Math.min(100, v));
    dispatch({ type: "VOLUME_CHANGE", volume: nextVolume });
  };

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
