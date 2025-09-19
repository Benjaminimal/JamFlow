import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui-lib";

type ErrorStateProps = ComponentProps<"div"> & {
  message: string;
  onRetry: () => void;
};

export function ErrorState({
  message,
  onRetry,
  className,
  ...props
}: ErrorStateProps): JSX.Element {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center",
        "my-4",
        "space-y-4",
        className,
      )}
      {...props}
    >
      <p>{message}</p>
      <Button aria-label="Retry" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
