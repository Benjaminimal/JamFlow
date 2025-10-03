import type { ComponentProps, JSX } from "react";

type ErrorDisplayProps = Omit<ComponentProps<"p">, "className"> & {
  message: string;
};

export function ErrorDisplay({
  message,
  ...props
}: ErrorDisplayProps): JSX.Element {
  return (
    <p className="text-destructive mt-1 text-sm" {...props}>
      {message}
    </p>
  );
}
