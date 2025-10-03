import { useCallback, useEffect, useState } from "react";

import type { Bounds } from "@/components/clipper/types";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION, type UseClipperResult } from "@/hooks/useClipper";

const NUDGE_STEP = 0.5 * 1_000;

export type NudgeDirection = "forward" | "backward";

export type ClipperViewBoundsResult = {
  viewBounds: Bounds;
  nudgeStart: (d: NudgeDirection) => void;
  nudgeEnd: (d: NudgeDirection) => void;
};

// TODO: think about how much reverse padding from current position is good UX
export function useClipperViewBounds(
  clipper: UseClipperResult,
): ClipperViewBoundsResult {
  const {
    state: { duration },
    actions: { getPosition, subscribe },
  } = usePlaybackContext();

  const {
    state: { start, end },
    actions: { setStart, setEnd },
  } = clipper;

  const getViewBounds = useCallback(() => {
    const padding = 30_000;
    const windowDuration = MAX_CLIP_DURATION + 2 * padding;
    const start = Math.max(0, getPosition() - padding);
    const end = Math.min(duration, start + windowDuration);
    return { start, end };
  }, [getPosition, duration]);

  const [viewBounds, setViewBounds] = useState(getViewBounds);

  // Update view bounds on seek events
  useEffect(() => {
    const handleSeek = (event: PlaybackEvent) => {
      if (event.type !== "seek") return;

      // TODO: it would be a lot more usable to set new bound on UI seek
      // instead of checking bounds
      if (event.target < viewBounds.start || event.target > viewBounds.end) {
        setViewBounds(getViewBounds());
      }
    };

    const unsubscribe = subscribe(handleSeek);
    return () => unsubscribe();
  }, [subscribe, viewBounds, getViewBounds]);

  const nudge = (
    value: number,
    setter: (v: number) => void,
    direction: NudgeDirection,
  ): void => {
    const directionFactor = direction === "forward" ? 1 : -1;
    const nudgedValue = value + directionFactor * NUDGE_STEP;
    const clamper = (v: number) =>
      direction === "backward"
        ? Math.max(viewBounds.start, v)
        : Math.min(viewBounds.end, v);
    const nextValue = clamper(nudgedValue);
    setter(nextValue);
  };

  const nudgeStart = (d: NudgeDirection) => nudge(start, setStart, d);
  const nudgeEnd = (d: NudgeDirection) => nudge(end, setEnd, d);

  return {
    viewBounds,
    nudgeStart,
    nudgeEnd,
  };
}
