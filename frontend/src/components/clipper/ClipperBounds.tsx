import { type JSX, type PointerEvent, useEffect, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { formatDuration, timeToPositionPercent } from "@/lib/time";
import { cn } from "@/lib/utils";

export type DraggingThumb = "start" | "end";

type ClipperBoundsProps = {
  windowStart: number;
  windowEnd: number;
  clipStart: number;
  setStart: (v: number) => void;
  clipEnd: number;
  setEnd: (v: number) => void;
  clampStart: (start: number, end: number) => number;
  clampEnd: (end: number, start: number) => number;
  draggingThumb: DraggingThumb | null;
  setDraggingThumb: (v: DraggingThumb | null) => void;
  startTarget: number;
  setStartTarget: (v: number) => void;
  endTarget: number;
  setEndTarget: (v: number) => void;
};

export function ClipperBounds({
  windowStart,
  windowEnd,
  clipStart,
  setStart,
  clipEnd,
  setEnd,
  clampStart,
  clampEnd,
  draggingThumb,
  setDraggingThumb,
  startTarget,
  setStartTarget,
  endTarget,
  setEndTarget,
}: ClipperBoundsProps): JSX.Element {
  const startDisplay = draggingThumb === "start" ? startTarget : clipStart;
  const endDisplay = draggingThumb === "end" ? endTarget : clipEnd;

  const onPointerDown = (
    e: PointerEvent<HTMLDivElement>,
    thumb: "start" | "end",
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingThumb(thumb);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingThumb) return;
    e.preventDefault();
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const factor = (e.clientX - left) / width;
    const time = windowStart + factor * (windowEnd - windowStart);

    if (draggingThumb === "start") {
      setStartTarget(clampStart(time, endDisplay));
    } else if (draggingThumb === "end") {
      setEndTarget(clampEnd(time, startDisplay));
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (draggingThumb === "start" && startTarget !== clipStart) {
      setStart(clampStart(startTarget, endDisplay));
    } else if (draggingThumb === "end" && endTarget !== clipEnd) {
      setEnd(clampEnd(endTarget, startDisplay));
    }
    setDraggingThumb(null);
  };

  return (
    <div
      className="absolute z-10 h-full w-full touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <ClipperThumb
        thumbRole="start"
        timestamp={startDisplay}
        offset={timeToPositionPercent(startDisplay, windowStart, windowEnd)}
        onPointerDown={(e) => onPointerDown(e, "start")}
      />
      <ProgressLine windowStart={windowStart} windowEnd={windowEnd} />
      <ClipperThumb
        thumbRole="end"
        timestamp={endDisplay}
        offset={timeToPositionPercent(endDisplay, windowStart, windowEnd)}
        onPointerDown={(e) => onPointerDown(e, "end")}
      />
    </div>
  );
}

type ClipperThumbProps = {
  thumbRole: DraggingThumb;
  timestamp: number;
  offset: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
};

function ClipperThumb({
  thumbRole,
  timestamp,
  offset,
  onPointerDown,
}: ClipperThumbProps) {
  return (
    <div
      className={cn(
        "absolute h-[120%] w-[2px] bg-red-500",
        thumbRole === "start" ? "top-0" : "bottom-0",
      )}
      style={{ left: `${offset}%` }}
    >
      <div
        className={cn(
          "absolute left-1/2 h-6 w-6 -translate-x-1/2",
          "border-secondary rounded-full border-2 bg-red-500",
          thumbRole === "end" ? "-top-6" : "-bottom-6",
        )}
        onPointerDown={onPointerDown}
      />
      <div
        className={cn(
          "text text-muted-foreground absolute -translate-x-1/2 text-xs",
          thumbRole === "end" ? "-bottom-5" : "-top-5",
        )}
      >
        {formatDuration(timestamp)}
      </div>
    </div>
  );
}

type ProgressLineProps = {
  windowStart: number;
  windowEnd: number;
};

function ProgressLine({
  windowStart,
  windowEnd,
}: ProgressLineProps): JSX.Element {
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const {
    actions: { subscribe },
  } = usePlaybackContext();

  useEffect(() => {
    const syncPosition = (event: PlaybackEvent) => {
      if (event.type !== "progress") return;
      setPlaybackPosition(event.position);
    };

    const unsubscribe = subscribe(syncPosition);

    return () => unsubscribe();
  }, [subscribe]);

  const offset = timeToPositionPercent(
    playbackPosition,
    windowStart,
    windowEnd,
  );

  return (
    <div
      className="absolute h-full w-[2px] bg-yellow-500"
      style={{
        left: `${offset}%`,
      }}
    ></div>
  );
}
