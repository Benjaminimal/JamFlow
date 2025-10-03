import { RefreshCw } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";

export function LoopButton(
  props: Omit<ComponentProps<typeof IconButton>, "icon" | "ariaLabel">,
): JSX.Element {
  return <IconButton icon={RefreshCw} aria-label="loop" {...props} />;
}
