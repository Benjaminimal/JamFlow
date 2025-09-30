import { type JSX } from "react";

import { formatDuration, timeToPositionPercent } from "@/lib/time";

type ClipperRulerProps = {
  windowStart: number;
  windowEnd: number;
  markerDistance: number;
};

export function ClipperRuler({
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
