import { type JSX } from "react";

import { Timecode } from "@/components/clipper";
import type { Bounds } from "@/components/clipper/types";
import { timeToPositionPercent } from "@/lib/time";

type ClipperRulerProps = {
  viewBounds: Bounds;
  markerDistance: number;
};

export function ClipperRuler({
  viewBounds,
  markerDistance,
}: ClipperRulerProps): JSX.Element {
  const stepSize = markerDistance / 2;
  const firstMarkerTime = Math.ceil(viewBounds.start / stepSize) * stepSize;
  const lastMarkerTime = Math.floor(viewBounds.end / stepSize) * stepSize;
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
              offset={timeToPositionPercent(
                t,
                viewBounds.start,
                viewBounds.end,
              )}
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
      {isMajor && <Timecode time={timestamp} className="mb-1" />}
      <span className={`bg-muted w-0.5 ${isMajor ? "h-3" : "h-2"}`}></span>
    </div>
  );
}
