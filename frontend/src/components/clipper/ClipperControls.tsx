import { type JSX, useCallback, useEffect, useState } from "react";

import {
  ClipperBar,
  ClipperBounds,
  ClipperRuler,
  type DraggingThumb,
} from "@/components/clipper";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION } from "@/hooks/useClipper";

type ClipperControlsProps = {
  clipStart: number;
  clipEnd: number;
  setStart: (v: number) => void;
  setEnd: (v: number) => void;
  clampStart: (start: number, end: number) => number;
  clampEnd: (end: number, start: number) => number;
};

export function ClipperControls({
  clipStart,
  clipEnd,
  setStart,
  setEnd,
  clampStart,
  clampEnd,
}: ClipperControlsProps): JSX.Element {
  const {
    state: { duration },
    actions: { getPosition, subscribe },
  } = usePlaybackContext();

  // TODO: think about how much reverse padding from current position is good UX
  const getWindowBounds = useCallback(() => {
    const padding = 30_000;
    const windowDuration = MAX_CLIP_DURATION + 2 * padding;
    const start = Math.max(0, getPosition() - padding);
    const end = Math.min(duration, start + windowDuration);
    return { start, end };
  }, [getPosition, duration]);

  const [windowBounds, setWindowBounds] = useState(getWindowBounds);

  useEffect(() => {
    const handleSeek = (event: PlaybackEvent) => {
      if (event.type !== "seek") return;

      // TODO: it would be a lot more usable to set new bound on UI seek
      // instead of checking bounds
      if (
        event.target < windowBounds.start ||
        event.target > windowBounds.end
      ) {
        setWindowBounds(getWindowBounds());
      }
    };

    const unsubscribe = subscribe(handleSeek);
    return () => unsubscribe();
  }, [subscribe, windowBounds, getWindowBounds]);

  const windowStart = windowBounds.start;
  const windowEnd = windowBounds.end;

  const [draggingThumb, setDraggingThumb] = useState<DraggingThumb | null>(
    null,
  );
  const [startTarget, setStartTarget] = useState(clipStart);
  const [endTarget, setEndTarget] = useState(clipEnd);

  const startDisplay = draggingThumb === "start" ? startTarget : clipStart;
  const endDisplay = draggingThumb === "end" ? endTarget : clipEnd;

  return (
    <div className="flex flex-col space-y-2">
      <div className="my-8">
        <div className="relative w-full space-y-2">
          <ClipperBounds
            windowStart={windowStart}
            windowEnd={windowEnd}
            clipStart={clipStart}
            clipEnd={clipEnd}
            setStart={setStart}
            setEnd={setEnd}
            clampStart={clampStart}
            clampEnd={clampEnd}
            draggingThumb={draggingThumb}
            setDraggingThumb={setDraggingThumb}
            startTarget={startTarget}
            setStartTarget={setStartTarget}
            endTarget={endTarget}
            setEndTarget={setEndTarget}
          />
          <ClipperBar
            windowStart={windowStart}
            windowEnd={windowEnd}
            clipStart={startDisplay}
            clipEnd={endDisplay}
          />
          <ClipperRuler
            windowStart={windowStart}
            windowEnd={windowEnd}
            markerDistance={60_000}
          />
        </div>
      </div>
    </div>
  );
}
