import type { ComponentProps, ElementType, JSX } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui-lib";

type IconButtonProps = ComponentProps<"button"> & {
  icon: ElementType;
  ariaLabel: string;
  onClick: () => void;
  className?: string;
};

export function IconButton({
  icon: Icon,
  ariaLabel,
  onClick,
  className,
  ...props
}: IconButtonProps): JSX.Element {
  return (
    <Button
      onClick={onClick}
      className={cn("rounded-full p-2", className)}
      variant="ghost"
      aria-label={ariaLabel}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
