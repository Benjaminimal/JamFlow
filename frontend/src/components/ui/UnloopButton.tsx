import { RefreshCwOff } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";

export function UnloopButton(
  props: Omit<ComponentProps<typeof IconButton>, "icon" | "ariaLabel">,
): JSX.Element {
  return <IconButton icon={RefreshCwOff} aria-label="unloop" {...props} />;
}
