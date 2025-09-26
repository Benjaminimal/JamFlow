import { useEffect, useReducer } from "react";

import { postClip } from "@/api/clips";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { ValidationError } from "@/errors";
import { getErrorMessage } from "@/lib/errorUtils";
import { getLogger } from "@/lib/logging";
import type { Clip, Track } from "@/types";

export const ClipperStatus = {
  Idle: "idle",
  Active: "active",
  Submitting: "submitting",
} as const;

const logger = getLogger("useClipper");

// TODO: when clips are playable as well we need to reconsider how we handle playable as the type will broaden
const START_OFFSET = 5 * 1_000;
const END_OFFSET = 60 * 1_000;
const SEEK_END_OFFSET = 1 * 1_000;
const MIN_CLIP_DURATION = 15 * 1_000;
const MAX_CLIP_DURATION = 3 * 60 * 1_000;
const MAX_TITLE_LENGTH = 255;

type ClipperStatus = (typeof ClipperStatus)[keyof typeof ClipperStatus];

type ClipperState = {
  status: ClipperStatus;
  start: number;
  end: number;
  title: string;
  track: Track | null;
  createdClip: Clip | null;
  errorMessage: string | null;
};

type ClipperActions = {
  startClipping: () => void;
  cancelClipping: () => void;
  submitClip: () => Promise<void>;
  setStart: (v: number) => void;
  setEnd: (v: number) => void;
  setTitle: (v: string) => void;
};

type ClipperDerived = {
  isIdle: boolean;
  isActive: boolean;
  isSubmitting: boolean;
  isClippable: boolean;
};

type ClipperUtils = {
  clampStart: (rawStart: number, end: number) => number;
  clampEnd: (rawEnd: number, start: number, duration: number) => number;
};

type UseClipperResult = {
  state: ClipperState;
  actions: ClipperActions;
  derived: ClipperDerived;
  utils: ClipperUtils;
};

const initialState: ClipperState = {
  status: ClipperStatus.Idle,
  start: 0,
  end: 0,
  title: "",
  track: null,
  createdClip: null,
  errorMessage: null,
};

type ClipperAction =
  | { type: "START_CLIPPING"; position: number; track: Track }
  | { type: "CANCEL_CLIPPING" }
  | { type: "SET_BOUNDS"; start: number; end: number }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_ERROR"; message: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; clip: Clip }
  | { type: "SUBMIT_ERROR"; message: string };

type ClipperActionType = ClipperAction["type"];

const allowedActions: Record<ClipperStatus, ClipperActionType[]> = {
  [ClipperStatus.Idle]: ["START_CLIPPING"],
  [ClipperStatus.Active]: [
    "CANCEL_CLIPPING",
    "SET_BOUNDS",
    "SET_TITLE",
    "SUBMIT_START",
  ],
  [ClipperStatus.Submitting]: ["SUBMIT_SUCCESS", "SUBMIT_ERROR"],
};

function clipperReducer(
  state: ClipperState,
  action: ClipperAction,
): ClipperState {
  logger.info("ClipperAction", action);
  if (!allowAction(state.status, action.type)) {
    logger.warn(`Action ${action.type} not allowed in status ${state.status}`);
    return state;
  }
  switch (action.type) {
    case "START_CLIPPING": {
      const { start, end } = getInitialBounds(
        action.position,
        action.track.duration,
      );

      return {
        ...state,
        status: ClipperStatus.Active,
        start,
        end,
        title: "",
        track: action.track,
        errorMessage: null,
      };
    }
    case "CANCEL_CLIPPING": {
      return {
        ...initialState,
      };
    }
    case "SET_BOUNDS": {
      return {
        ...state,
        start: action.start,
        end: action.end,
      };
    }
    case "SET_TITLE": {
      return {
        ...state,
        title: action.title,
      };
    }
    case "SUBMIT_START": {
      return {
        ...state,
        status: ClipperStatus.Submitting,
        errorMessage: null,
      };
    }
    case "SUBMIT_SUCCESS": {
      return {
        ...state,
        status: ClipperStatus.Idle,
        createdClip: action.clip,
      };
    }
    case "SUBMIT_ERROR": {
      return {
        ...state,
        status: ClipperStatus.Active,
        errorMessage: action.message,
      };
    }
    default: {
      logger.warn(`Action ${action.type} not implemented yet`);
      return state;
    }
  }
}

function allowAction(
  status: ClipperStatus,
  actionType: ClipperActionType,
): boolean {
  return allowedActions[status].includes(actionType);
}

export function useClipper(): UseClipperResult {
  const [state, dispatch] = useReducer(clipperReducer, initialState);

  const {
    state: { playable, duration },
    actions: { seek, getPosition, subscribe },
    derived: { isPlaying, isPaused },
  } = usePlaybackContext();

  const isIdle = state.status === ClipperStatus.Idle;
  const isActive = state.status === ClipperStatus.Active;
  const isSubmitting = state.status === ClipperStatus.Submitting;
  const isClippable =
    !!playable &&
    playable.duration > MAX_CLIP_DURATION &&
    (isPlaying || isPaused);

  const startClipping = () => {
    if (!isClippable) return;
    if (!allowAction(state.status, "START_CLIPPING")) return;

    dispatch({
      type: "START_CLIPPING",
      position: getPosition(),
      track: playable,
    });
  };

  const cancelClipping = () => {
    dispatch({ type: "CANCEL_CLIPPING" });
  };

  const submitClip = async () => {
    if (!allowAction(state.status, "SUBMIT_START")) return;
    if (!state.track) {
      logger.warn("No playable track available for clipping");
      return;
    }

    dispatch({ type: "SUBMIT_START" });
    try {
      const clip = await postClip({
        track_id: state.track.id,
        title: state.title,
        start: state.start,
        end: state.end,
      });
      dispatch({ type: "SUBMIT_SUCCESS", clip });
    } catch (error) {
      if (error instanceof ValidationError) {
        // TODO: improve error message handling
        const message = Object.values(error.details).join(", ");
        dispatch({ type: "SUBMIT_ERROR", message });
      } else {
        const message = getErrorMessage(error);
        dispatch({ type: "SUBMIT_ERROR", message });
      }
    }
  };

  const setStart = (rawStart: number) => {
    const end = state.end;
    const start = clampStart(rawStart, end);
    dispatch({ type: "SET_BOUNDS", start, end });
    seek(start);
  };

  const setEnd = (rawEnd: number) => {
    const start = state.start;
    const end = clampEnd(rawEnd, start, duration);
    dispatch({ type: "SET_BOUNDS", start, end });
    seek(end - SEEK_END_OFFSET);
  };

  const setTitle = (title: string) => {
    const sanitized = sanitizeTitle(title);
    const error = validateTitle(sanitized);
    if (error) {
      dispatch({ type: "SET_ERROR", message: error });
    } else {
      dispatch({ type: "SET_TITLE", title });
    }
  };

  // Cancel clipping if playable changes
  useEffect(() => {
    if (isIdle) return;
    if (state.track?.id === playable?.id) return;
    dispatch({ type: "CANCEL_CLIPPING" });
  }, [isIdle, playable, state.track]);

  // Loop clip window
  useEffect(() => {
    const loopClipWindow = (event: PlaybackEvent) => {
      if (isIdle) return;
      if (event.type !== "progress") return;

      if (event.position > state.end) {
        seek(state.start);
      }
    };

    const unsubscribe = subscribe(loopClipWindow);
    return () => unsubscribe();
  }, [isIdle, subscribe, seek, state.start, state.end]);

  // Move clip window on out of bounds seek
  useEffect(() => {
    const moveClipWindow = (event: PlaybackEvent) => {
      if (isIdle) return;
      if (event.type !== "seek") return;

      const position = event.target;
      if (state.start <= position && position <= state.end) return;

      const { start, end } = getInitialBounds(position, duration);
      dispatch({ type: "SET_BOUNDS", start, end });
    };

    const unsubscribe = subscribe(moveClipWindow);
    return () => unsubscribe();
  }, [isIdle, state.start, state.end, duration, subscribe]);

  return {
    state,
    actions: {
      startClipping,
      cancelClipping,
      submitClip,
      setStart,
      setEnd,
      setTitle,
    },
    derived: {
      isIdle,
      isActive,
      isSubmitting,
      isClippable,
    },
    utils: {
      clampStart,
      clampEnd,
    },
  };
}

/**
 * 0 - START - POSITION - END - DURATION
 * At all times we need to ensure the following invariants:
 * 0 <= START
 * END <= DURATION
 * START < END
 * MIN_CLIP_DURATION <= END - START
 * END - START <= MAX_CLIP_DURATION
 */
function clampStart(rawStart: number, end: number): number {
  const lowerBound = Math.max(0, end - MAX_CLIP_DURATION);
  const upperBound = end - MIN_CLIP_DURATION;
  return clamp(rawStart, lowerBound, upperBound);
}

function clampEnd(rawEnd: number, start: number, duration: number): number {
  const lowerBound = start + MIN_CLIP_DURATION;
  const upperBound = Math.min(duration, start + MAX_CLIP_DURATION);
  return clamp(rawEnd, lowerBound, upperBound);
}

function getInitialBounds(
  position: number,
  duration: number,
): { start: number; end: number } {
  const rawStart = position - START_OFFSET;
  const rawEnd = position + END_OFFSET;
  const start = Math.max(0, rawStart);
  const end = clampEnd(rawEnd, start, duration);
  return { start, end };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sanitizeTitle(v: string): string {
  return v.trim();
}

function validateTitle(v: string): string | null {
  if (!v) return "Title cannot be empty";
  if (v.length > MAX_TITLE_LENGTH) return "Title is too long";
  return null;
}
