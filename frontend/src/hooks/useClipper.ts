import { useEffect, useReducer } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { getLogger } from "@/lib/logging";

export const ClipperStatus = {
  Idle: "idle",
  Active: "active",
  Submitting: "submitting",
} as const;

const logger = getLogger("useClipper");

// TODO:
// - Refine getBounds to enforce all invariants
//   * introduce max clip duration
//   * introduce min clip duration
// - Add unit tests for useClipper
// - UI/UX improvements
// - Implement submitClip
// - Implement SET_TITLE
// - Implement SET_ERROR
// - Fine tune the constants

const START_OFFSET = 5_000;
const END_OFFSET = 60_000;
const SEEK_END_OFFSET = 1_000;

type ClipperStatus = (typeof ClipperStatus)[keyof typeof ClipperStatus];

type ClipperState = {
  status: ClipperStatus;
  start: number;
  end: number;
  title: string;
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

type UseClipperResult = {
  state: ClipperState;
  actions: ClipperActions;
  derived: ClipperDerived;
};

const initialState: ClipperState = {
  status: ClipperStatus.Idle,
  start: 0,
  end: 0,
  title: "",
  errorMessage: null,
};

type ClipperAction =
  | { type: "START_CLIPPING"; position: number; duration: number }
  | { type: "SUBMIT_CLIP" }
  | { type: "CANCEL_CLIPPING" }
  | { type: "SET_BOUNDS"; start: number; end: number }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_ERROR"; message: string | null };

type ClipperActionType = ClipperAction["type"];

const allowedActions: Record<ClipperStatus, ClipperActionType[]> = {
  [ClipperStatus.Idle]: ["START_CLIPPING"],
  [ClipperStatus.Active]: [
    "SUBMIT_CLIP",
    "CANCEL_CLIPPING",
    "SET_BOUNDS",
    "SET_TITLE",
    "SET_ERROR",
  ],
  [ClipperStatus.Submitting]: ["SET_ERROR"],
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
      const { start, end } = getInitialBounds(action.position, action.duration);

      return {
        ...state,
        status: ClipperStatus.Active,
        start,
        end,
        title: "",
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
    state: { duration },
    actions: { seek, getPosition, subscribe },
    derived: { isPlaying, isPaused },
  } = usePlaybackContext();

  const isIdle = state.status === ClipperStatus.Idle;
  const isActive = state.status === ClipperStatus.Active;
  const isSubmitting = state.status === ClipperStatus.Submitting;
  const isClippable = isPlaying || isPaused;

  const startClipping = () => {
    dispatch({
      type: "START_CLIPPING",
      position: getPosition(),
      duration,
    });
  };

  const cancelClipping = () => {
    dispatch({ type: "CANCEL_CLIPPING" });
  };

  const submitClip = async () => {};

  const setStart = (rawStart: number) => {
    const { start, end } = getBounds(rawStart, state.end, duration);
    dispatch({ type: "SET_BOUNDS", start, end });
    seek(start);
  };

  const setEnd = (rawEnd: number) => {
    const { start, end } = getBounds(state.start, rawEnd, duration);
    dispatch({ type: "SET_BOUNDS", start, end });
    seek(end - SEEK_END_OFFSET);
  };

  const setTitle = (title: string) => {
    dispatch({ type: "SET_TITLE", title });
  };

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
  };
}

/**
 * 0 - START - POSITION - END - DURATION
 * At all times we need to ensure the following invariants:
 * 0 <= START
 * END <= DURATION
 * START < END
 */
function getBounds(
  rawStart: number,
  rawEnd: number,
  duration: number,
): { start: number; end: number } {
  const start = Math.max(0, rawStart);
  const end = Math.min(duration, rawEnd);

  if (start >= end) {
    // TODO: implement heuristics to determine which side to adjust
  }

  return { start, end };
}

function getInitialBounds(
  position: number,
  duration: number,
): { start: number; end: number } {
  return getBounds(position - START_OFFSET, position + END_OFFSET, duration);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const __test = { getBounds, clamp };
