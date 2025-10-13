import { useCallback, useEffect, useState } from "react";

import type { Bounds } from "@/components/clipper/types";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION } from "@/hooks/useClipper";

export type NudgeDirection = "forward" | "backward";

export type ClipperViewBoundsResult = {
  viewBounds: Bounds;
};

const VIEW_PADDING = 30 * 1_000;

// TODO: think about how much reverse padding from current position is good UX
export function useClipperViewBounds(): ClipperViewBoundsResult {
  const {
    state: { duration },
    actions: { getPosition, subscribe },
  } = usePlaybackContext();

  const getViewBounds = useCallback(() => {
    const windowDuration = MAX_CLIP_DURATION + 2 * VIEW_PADDING;
    const start = Math.max(0, getPosition() - VIEW_PADDING);
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

  return {
    viewBounds,
  };
}
