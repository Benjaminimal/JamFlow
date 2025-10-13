import { type PointerEvent } from "react";

import type { DraggingThumb } from "@/components/clipper/types";
import { cn } from "@/lib/utils";

type ClipperThumbProps = {
  thumbRole: DraggingThumb;
  offset: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
};

export function ClipperThumb({
  thumbRole,
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
    </div>
  );
}
