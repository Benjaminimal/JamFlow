import type { ComponentProps, JSX } from "react";

import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";

// TODO: consider putting this in UI and adding variants
type TimecodeProps = {
  time: number; // in milliseconds
} & ComponentProps<"span">;

export function Timecode({
  time,
  className,
  ...props
}: TimecodeProps): JSX.Element {
  return (
    <span className={cn("text-muted-foreground text-xs", className)} {...props}>
      {formatDuration(time)}
    </span>
  );
}
