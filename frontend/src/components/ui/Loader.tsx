import type { ComponentProps, JSX } from "react";

import { Spinner } from "@/components/primitives";
import { cn } from "@/lib/utils";

type LoaderProps = ComponentProps<"div"> & {
  spinnerProps?: ComponentProps<typeof Spinner>;
};

export function Loader({
  className,
  spinnerProps,
  ...props
}: LoaderProps): JSX.Element {
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
