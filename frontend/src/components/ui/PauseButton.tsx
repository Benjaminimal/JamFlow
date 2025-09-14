import { Pause } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui-lib";

export default function PauseButton({
  onPause,
  className,
}: {
  onPause: () => void;
  className?: string;
}): JSX.Element {
  return (
    <Button
      onClick={onPause}
      className={cn("rounded-full p-2", className)}
      variant="ghost"
      aria-label="pause"
    >
      <Pause className="h-4 w-4" />
    </Button>
  );
}
