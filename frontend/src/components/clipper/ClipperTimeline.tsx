import { type JSX, type PointerEvent } from "react";

import {
  ClipperRange,
  ClipperRuler,
  ClipperThumb,
  PlaybackProgress,
} from "@/components/clipper";
import type { Bounds, DraggingThumb } from "@/components/clipper/types";
import type { UseClipperResult } from "@/hooks/useClipper";
import { percentToTime, timeToPositionPercent } from "@/lib/time";

type ClipperTimelineProps = {
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

const RULER_MARKER_DISTANCE = 60_000;

export function ClipperTimeline({
  clipper,
  viewBounds,
  draggingThumb,
  setDraggingThumb,
  startTarget,
  setStartTarget,
  endTarget,
  setEndTarget,
  seek,
}: ClipperTimelineProps): JSX.Element {
  const {
    state: { start: clipStart, end: clipEnd },
    actions: { setStart, setEnd },
    utils: { clampStart, clampEnd },
  } = clipper;

  const startDisplay = draggingThumb === "start" ? startTarget : clipStart;
  const endDisplay = draggingThumb === "end" ? endTarget : clipEnd;

  const handlePointerDown = (
    e: PointerEvent<HTMLDivElement>,
    thumb: "start" | "end",
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingThumb(thumb);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
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

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
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
      className="relative my-8 w-full touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleSeek}
    >
      <div className="space-y-2">
        <ClipperRange
          viewBounds={viewBounds}
          clipBounds={{
            start: startDisplay,
            end: endDisplay,
          }}
        />
        <ClipperRuler
          viewBounds={viewBounds}
          markerDistance={RULER_MARKER_DISTANCE}
        />
      </div>
      <ClipperThumb
        thumbRole="start"
        offset={timeToPositionPercent(
          startDisplay,
          viewBounds.start,
          viewBounds.end,
        )}
        onPointerDown={(e) => handlePointerDown(e, "start")}
      />
      <ClipperThumb
        thumbRole="end"
        offset={timeToPositionPercent(
          endDisplay,
          viewBounds.start,
          viewBounds.end,
        )}
        onPointerDown={(e) => handlePointerDown(e, "end")}
      />
      <PlaybackProgress viewBounds={viewBounds} />
    </div>
  );
}
