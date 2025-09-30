import { type JSX } from "react";

import type { Bounds } from "@/components/clipper/types";
import { timeToPositionPercent } from "@/lib/time";

type ClipperBarProps = {
  viewBounds: Bounds;
  clipBounds: Bounds;
};

export function ClipperBar({
  viewBounds,
  clipBounds,
}: ClipperBarProps): JSX.Element {
  const startPercent = timeToPositionPercent(
    clipBounds.start,
    viewBounds.start,
    viewBounds.end,
  );
  const endPercent = timeToPositionPercent(
    clipBounds.end,
    viewBounds.start,
    viewBounds.end,
  );
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
