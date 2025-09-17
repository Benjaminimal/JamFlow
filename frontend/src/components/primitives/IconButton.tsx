import type { ComponentProps, ElementType, JSX } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui-lib";

type IconButtonProps = ComponentProps<typeof Button> & {
  icon: ElementType;
};

export function IconButton({
  icon: Icon,
  className,
  ...props
}: IconButtonProps): JSX.Element {
  return (
    <Button
      className={cn("rounded-full", className)}
      variant="ghost"
      {...props}
    >
      <Icon />
    </Button>
  );
}
