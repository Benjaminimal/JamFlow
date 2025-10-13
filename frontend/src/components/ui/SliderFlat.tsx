import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";
import { Slider } from "@/ui-lib";

type SliderFlatProps = ComponentProps<typeof Slider>;

export function SliderFlat({
  className,
  ...props
}: SliderFlatProps): JSX.Element {
  return (
    <Slider
      className={cn(
        "[&_[data-slot='slider-range']]:rounded-full [&_[data-slot='slider-thumb']]:hidden",
        className,
      )}
      {...props}
    />
  );
}
