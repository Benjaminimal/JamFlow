import { Loader } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

type SpinnerProps = ComponentProps<typeof Loader>;
export function Spinner({ className, ...props }: SpinnerProps): JSX.Element {
  return (
    <Loader
      className={cn(
        "animate-spin [animation-duration:1.8s]",
        "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
