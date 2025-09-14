import { Play } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui-lib";

export default function PlayButton({
  onPlay,
  className,
}: {
  onPlay: () => void;
  className?: string;
}): JSX.Element {
  return (
    <Button
      onClick={onPlay}
      className={cn("rounded-full p-2", className)}
      variant="ghost"
      aria-label="play"
    >
      <Play className="h-4 w-4" />
    </Button>
  );
}
