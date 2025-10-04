import { StepBack, StepForward } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";

const STEP_SIZE = 5 * 1_000;

type StepButtonProps = {
  variant: "forward" | "back";
  stepSize?: number;
} & Pick<ComponentProps<typeof IconButton>, "size" | "className" | "disabled">;

export function StepButton({
  variant,
  stepSize = STEP_SIZE,
  ...props
}: StepButtonProps): JSX.Element {
  const {
    state: { playable },
    actions: { getPosition, seek },
  } = usePlaybackContext();

  const handleStepBack = (): void => {
    if (!playable) return;
    seek(getPosition() - stepSize);
  };

  const handleStepForward = (): void => {
    if (!playable) return;
    seek(getPosition() + stepSize);
  };

  return (
    <IconButton
      onClick={variant === "forward" ? handleStepForward : handleStepBack}
      icon={variant === "forward" ? StepForward : StepBack}
      {...props}
    />
  );
}
