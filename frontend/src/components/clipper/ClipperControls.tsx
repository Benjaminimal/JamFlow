import { type JSX, useCallback, useEffect, useState } from "react";

import {
  ClipperBar,
  ClipperBounds,
  ClipperRuler,
  type DraggingThumb,
} from "@/components/clipper";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION, type UseClipperResult } from "@/hooks/useClipper";

const RULER_MARKER_DISTANCE = 60_000;

type ClipperControlsProps = {
  clipper: UseClipperResult;
};

export function ClipperControls({
  clipper,
}: ClipperControlsProps): JSX.Element {
  const {
    state: { duration },
    actions: { getPosition, subscribe },
  } = usePlaybackContext();

  const {
    state: { start: clipStart, end: clipEnd },
  } = clipper;

  // TODO: think about how much reverse padding from current position is good UX
  const getViewBounds = useCallback(() => {
    const padding = 30_000;
    const windowDuration = MAX_CLIP_DURATION + 2 * padding;
    const start = Math.max(0, getPosition() - padding);
    const end = Math.min(duration, start + windowDuration);
    return { start, end };
  }, [getPosition, duration]);

  const [viewBounds, setViewBounds] = useState(getViewBounds);

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

  const [draggingThumb, setDraggingThumb] = useState<DraggingThumb | null>(
    null,
  );
  const [startTarget, setStartTarget] = useState(clipStart);
  const [endTarget, setEndTarget] = useState(clipEnd);

  const clipDisplayBounds = {
    start: draggingThumb === "start" ? startTarget : clipStart,
    end: draggingThumb === "end" ? endTarget : clipEnd,
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="my-8">
        <div className="relative w-full space-y-2">
          <ClipperBounds
            clipper={clipper}
            viewBounds={viewBounds}
            draggingThumb={draggingThumb}
            setDraggingThumb={setDraggingThumb}
            startTarget={startTarget}
            setStartTarget={setStartTarget}
            endTarget={endTarget}
            setEndTarget={setEndTarget}
          />
          <ClipperBar viewBounds={viewBounds} clipBounds={clipDisplayBounds} />
          <ClipperRuler
            viewBounds={viewBounds}
            markerDistance={RULER_MARKER_DISTANCE}
          />
        </div>
      </div>
    </div>
  );
}
