import { type JSX } from "react";

import { timeToPositionPercent } from "@/lib/time";

type ClipperBarProps = {
  windowStart: number;
  windowEnd: number;
  clipStart: number;
  clipEnd: number;
};

export function ClipperBar({
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
