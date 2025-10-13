import { useCallback, useEffect, useReducer } from "react";

import { postClip } from "@/api/clips";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { asTrack, isSameTrack } from "@/contexts/playback/utils";
import { ValidationError, type ValidationErrorDetails } from "@/errors";
import { getErrorMessage } from "@/lib/errorUtils";
import { getLogger } from "@/lib/logging";
import type { Clip, SubmitResult, Track } from "@/types";

const logger = getLogger("useClipper");

const START_OFFSET = 5 * 1_000;
const END_OFFSET = 60 * 1_000;
const SEEK_END_OFFSET = 1 * 1_000;
export const MIN_CLIP_DURATION = 15 * 1_000;
export const MAX_CLIP_DURATION = 3 * 60 * 1_000;
const MAX_TITLE_LENGTH = 255;

export const ClipperStatus = {
  Idle: "idle",
  Active: "active",
  Submitting: "submitting",
} as const;

type ClipperStatus = (typeof ClipperStatus)[keyof typeof ClipperStatus];

type ClipperState = {
  status: ClipperStatus;
  start: number;
  end: number;
  title: string;
  track: Track | null;
  createdClip: Clip | null;
  validationErrors: ValidationErrorDetails;
};

type ClipperActions = {
  startClipping: () => void;
  cancelClipping: () => void;
  playStart: () => void;
  playEnd: () => void;
  setStart: (v: number) => void;
  setEnd: (v: number) => void;
  setTitle: (v: string) => void;
  validate: () => boolean;
  submitClip: () => Promise<SubmitResult>;
};

type ClipperDerived = {
  isIdle: boolean;
  isActive: boolean;
  isSubmitting: boolean;
  isClippable: boolean;
};

type ClipperUtils = {
  clampStart: (rawStart: number, end: number) => number;
  clampEnd: (rawEnd: number, start: number) => number;
};

export type UseClipperResult = {
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
  validationErrors: {},
};

type ClipperAction =
  | { type: "START_CLIPPING"; position: number; track: Track }
  | { type: "CANCEL_CLIPPING" }
  | { type: "SET_BOUNDS"; start: number; end: number }
  | { type: "SET_TITLE"; title: string; error: string | null }
  | { type: "SET_VALIDATION_ERRORS"; errors: ValidationErrorDetails }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; clip: Clip }
  | { type: "SUBMIT_FAILURE" };

type ClipperActionType = ClipperAction["type"];

const allowedActions: Record<ClipperStatus, ClipperActionType[]> = {
  [ClipperStatus.Idle]: ["START_CLIPPING"],
  [ClipperStatus.Active]: [
    "CANCEL_CLIPPING",
    "SET_BOUNDS",
    "SET_TITLE",
    "SET_VALIDATION_ERRORS",
    "SUBMIT_START",
  ],
  [ClipperStatus.Submitting]: ["SUBMIT_SUCCESS", "SUBMIT_FAILURE"],
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
      const { title: _, ...restErrors } = state.validationErrors;
      const nextErrors = action.error
        ? { ...restErrors, title: [action.error] }
        : restErrors;
      return {
        ...state,
        title: action.title,
        validationErrors: nextErrors,
      };
    }
    case "SET_VALIDATION_ERRORS": {
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          ...action.errors,
        },
      };
    }
    case "SUBMIT_START": {
      return {
        ...state,
        status: ClipperStatus.Submitting,
      };
    }
    case "SUBMIT_SUCCESS": {
      return {
        ...state,
        status: ClipperStatus.Idle,
        createdClip: action.clip,
      };
    }
    case "SUBMIT_FAILURE": {
      return {
        ...state,
        status: ClipperStatus.Active,
      };
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

  const track = asTrack(playable);

  const isIdle = state.status === ClipperStatus.Idle;
  const isActive = state.status === ClipperStatus.Active;
  const isSubmitting = state.status === ClipperStatus.Submitting;
  const isClippable =
    !!track && track.duration > MAX_CLIP_DURATION && (isPlaying || isPaused);

  const startClipping = () => {
    if (!isClippable) return;
    if (!allowAction(state.status, "START_CLIPPING")) return;

    dispatch({
      type: "START_CLIPPING",
      position: getPosition(),
      track,
    });
  };

  const cancelClipping = () => {
    dispatch({ type: "CANCEL_CLIPPING" });
  };

  const validate = useCallback((): boolean => {
    if (isSubmitting) return true;
    const titleError = validateTitle(sanitizeTitle(state.title));
    if (titleError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        errors: { title: [titleError] },
      });
      return false;
    }
    return true;
  }, [isSubmitting, state.title]);

  const submitClip = async (): Promise<SubmitResult> => {
    if (!allowAction(state.status, "SUBMIT_START"))
      return { success: false, error: "Can't clip" };
    if (!state.track) {
      logger.warn("No playable track available for clipping");
      return { success: false, error: "No track available" };
    }

    dispatch({ type: "SUBMIT_START" });
    try {
      const clip = await postClip({
        track_id: state.track.id,
        title: sanitizeTitle(state.title),
        start: state.start,
        end: state.end,
      });
      dispatch({ type: "SUBMIT_SUCCESS", clip });
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        const { title: titleErrors, ...restErrors } = error.details;
        if (titleErrors) {
          dispatch({
            type: "SET_VALIDATION_ERRORS",
            errors: { title: titleErrors },
          });
        }
        dispatch({ type: "SUBMIT_FAILURE" });
        const invisibleErrors = Object.values(restErrors).flat();
        if (invisibleErrors.length > 0) {
          // TODO: this will probably show a one large toast if there are multiple errors
          return { success: false, error: invisibleErrors.join(" | ") };
        }
        return { success: false };
      }
      const message = getErrorMessage(error);
      dispatch({ type: "SUBMIT_FAILURE" });
      return { success: false, error: message };
    }
  };

  const playStart = () => {
    seek(state.start);
  };

  const playEnd = () => {
    seek(state.end - SEEK_END_OFFSET);
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
    dispatch({ type: "SET_TITLE", title, error });
  };

  // Cancel clipping if track changes
  useEffect(() => {
    if (isIdle) return;
    if (isSameTrack(state.track, track)) return;
    dispatch({ type: "CANCEL_CLIPPING" });
  }, [isIdle, track, state.track]);

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

  const exposedClampStart = useCallback(
    (rawStart: number, end: number) => clampStart(rawStart, end),
    [],
  );

  const exposedClampEnd = useCallback(
    (rawEnd: number, start: number) => clampEnd(rawEnd, start, duration),
    [duration],
  );

  return {
    state,
    actions: {
      startClipping,
      cancelClipping,
      playStart,
      playEnd,
      setStart,
      setEnd,
      setTitle,
      validate,
      submitClip,
    },
    derived: {
      isIdle,
      isActive,
      isSubmitting,
      isClippable,
    },
    utils: {
      clampStart: exposedClampStart,
      clampEnd: exposedClampEnd,
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
  return Math.round(clamp(rawStart, lowerBound, upperBound));
}

function clampEnd(rawEnd: number, start: number, duration: number): number {
  const lowerBound = start + MIN_CLIP_DURATION;
  const upperBound = Math.min(duration, start + MAX_CLIP_DURATION);
  return Math.round(clamp(rawEnd, lowerBound, upperBound));
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
