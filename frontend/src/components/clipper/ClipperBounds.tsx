import { type JSX, type PointerEvent, useEffect, useState } from "react";

import type { Bounds } from "@/components/clipper/types";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import type { UseClipperResult } from "@/hooks/useClipper";
import { percentToTime, timeToPositionPercent } from "@/lib/time";
import { cn } from "@/lib/utils";

export type DraggingThumb = "start" | "end";

type ClipperBoundsProps = {
  clipper: UseClipperResult;
  viewBounds: Bounds;
  draggingThumb: DraggingThumb | null;
  setDraggingThumb: (v: DraggingThumb | null) => void;
  startTarget: number;
  setStartTarget: (v: number) => void;
  endTarget: number;
  setEndTarget: (v: number) => void;
  seek: (v: number) => void;
};

export function ClipperBounds({
  clipper,
  viewBounds,
  draggingThumb,
  setDraggingThumb,
  startTarget,
  setStartTarget,
  endTarget,
  setEndTarget,
  seek,
}: ClipperBoundsProps): JSX.Element {
  const {
    state: { start: clipStart, end: clipEnd },
    actions: { setStart, setEnd },
    utils: { clampStart, clampEnd },
  } = clipper;

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
    const time =
      viewBounds.start + factor * (viewBounds.end - viewBounds.start);

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

  const handleSeek = (e: PointerEvent<HTMLDivElement>) => {
    if (draggingThumb) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const factor = (e.clientX - left) / width;
    const seekTime = percentToTime(
      factor * 100,
      viewBounds.start,
      viewBounds.end,
    );
    if (seekTime < startTarget || seekTime > endTarget) return;
    seek(seekTime);
  };

  return (
    <div
      className="absolute z-10 h-full w-full touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleSeek}
    >
      <ClipperThumb
        thumbRole="start"
        timestamp={startDisplay}
        offset={timeToPositionPercent(
          startDisplay,
          viewBounds.start,
          viewBounds.end,
        )}
        onPointerDown={(e) => onPointerDown(e, "start")}
      />
      <ProgressLine viewBounds={viewBounds} />
      <ClipperThumb
        thumbRole="end"
        timestamp={endDisplay}
        offset={timeToPositionPercent(
          endDisplay,
          viewBounds.start,
          viewBounds.end,
        )}
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

function ClipperThumb({ thumbRole, offset, onPointerDown }: ClipperThumbProps) {
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
    </div>
  );
}

type ProgressLineProps = {
  viewBounds: Bounds;
};

function ProgressLine({ viewBounds }: ProgressLineProps): JSX.Element {
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
    viewBounds.start,
    viewBounds.end,
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
