import { type LucideIcon, StepBack, StepForward } from "lucide-react";
import type { JSX } from "react";

import { IconButton } from "@/components/primitives";

type ClipperBoundControlsProps = {
  onNudgeBack: () => void;
  onNudgeForward: () => void;
  onReplay: () => void;
  replayIcon: LucideIcon;
};

export function ClipperBoundControls({
  onNudgeBack,
  onNudgeForward,
  onReplay,
  replayIcon,
}: ClipperBoundControlsProps): JSX.Element {
  const buttonSize = "icon-lg";
  return (
    <div className="flex flex-row items-center justify-between px-2">
      <IconButton onClick={onNudgeBack} icon={StepBack} size={buttonSize} />
      <IconButton onClick={onReplay} icon={replayIcon} size={buttonSize} />
      <IconButton
        onClick={onNudgeForward}
        icon={StepForward}
        size={buttonSize}
      />
    </div>
  );
}
