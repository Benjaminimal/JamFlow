import { RotateCcw, RotateCw, StepBack, StepForward } from "lucide-react";
import type { JSX } from "react";

import { IconButton } from "@/components/primitives";

type ClipperButtonsProps = {
  variant: "start" | "end";
  stepBack: () => void;
  stepForward: () => void;
  replay: () => void;
};

export function ClipperButtons({
  variant,
  stepBack,
  stepForward,
  replay,
}: ClipperButtonsProps): JSX.Element {
  const buttonSize = "icon-lg";
  return (
    <div className="flex flex-row items-center justify-between px-2">
      <IconButton onClick={stepBack} icon={StepBack} size={buttonSize} />
      <IconButton
        onClick={replay}
        icon={variant === "start" ? RotateCcw : RotateCw}
        size={buttonSize}
      />
      <IconButton onClick={stepForward} icon={StepForward} size={buttonSize} />
    </div>
  );
}
