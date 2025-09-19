import type { ComponentProps, JSX } from "react";

import { Spinner } from "@/components/primitives";
import { cn } from "@/lib/utils";

type LoadingStateProps = ComponentProps<"div"> & {
  spinnerProps?: ComponentProps<typeof Spinner>;
};

export function LoadingState({
  className,
  spinnerProps,
  ...props
}: LoadingStateProps): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex flex-row items-center justify-center p-4", className)}
      {...props}
    >
      <Spinner {...spinnerProps} />
    </div>
  );
}
