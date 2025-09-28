import {
  type JSX,
  type PointerEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION } from "@/hooks/useClipper";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";

type ClipperControlsProps = {
  clipStart: number;
  clipEnd: number;
  setStart: (v: number) => void;
  setEnd: (v: number) => void;
  clampStart: (start: number, end: number) => number;
  clampEnd: (end: number, start: number) => number;
};

type DraggingThumb = "start" | "end";

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

function ClipperBounds({
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

type ClipperBarProps = {
  windowStart: number;
  windowEnd: number;
  clipStart: number;
  clipEnd: number;
};

function ClipperBar({
  windowStart,
  windowEnd,
  clipStart,
  clipEnd,
}: ClipperBarProps): JSX.Element {
  const startPercent = timeToPositionPercent(clipStart, windowStart, windowEnd);
  const endPercent = timeToPositionPercent(clipEnd, windowStart, windowEnd);
  const widthPercent = endPercent - startPercent;

  return (
    <div className="bg-muted relative h-1.5 w-full rounded-full">
      <div
        className="bg-accent-foreground absolute h-1.5"
        style={{
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        }}
      ></div>
    </div>
  );
}

type ClipperRulerProps = {
  windowStart: number;
  windowEnd: number;
  markerDistance: number;
};

function ClipperRuler({
  windowStart,
  windowEnd,
  markerDistance,
}: ClipperRulerProps): JSX.Element {
  const stepSize = markerDistance / 2;
  const firstMarkerTime = Math.ceil(windowStart / stepSize) * stepSize;
  const lastMarkerTime = Math.floor(windowEnd / stepSize) * stepSize;
  const markerTimes: number[] = [];
  for (let t = firstMarkerTime; t <= lastMarkerTime; t += stepSize) {
    markerTimes.push(t);
  }

  return (
    <div>
      <div className="relative h-8 w-full">
        {markerTimes.map((t) => {
          const isMajor = t % markerDistance === 0;
          return (
            <RulerMarker
              key={t}
              offset={timeToPositionPercent(t, windowStart, windowEnd)}
              timestamp={t}
              isMajor={isMajor}
            />
          );
        })}
        <div className="bg-muted absolute bottom-0 h-0.5 w-full"></div>
      </div>
    </div>
  );
}

type RulerMarkerProps = {
  offset: number;
  timestamp: number;
  isMajor: boolean;
};

function RulerMarker({
  offset,
  timestamp,
  isMajor,
}: RulerMarkerProps): JSX.Element {
  return (
    <div
      className="absolute bottom-0 flex translate-x-[-50%] flex-col items-center"
      style={{ left: `${offset}%` }}
    >
      {isMajor && (
        <span className="text-muted-foreground mb-1 text-xs">
          {formatDuration(timestamp)}
        </span>
      )}
      <span className={`bg-muted w-0.5 ${isMajor ? "h-3" : "h-2"}`}></span>
    </div>
  );
}

function timeToPositionPercent(
  time: number,
  startTime: number,
  endTime: number,
): number {
  if (time < startTime) return 0;
  if (time > endTime) return 100;
  return ((time - startTime) / (endTime - startTime)) * 100;
}
