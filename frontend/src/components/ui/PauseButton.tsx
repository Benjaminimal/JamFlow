import { Pause } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";

export function PauseButton(
  props: Omit<ComponentProps<typeof IconButton>, "icon" | "ariaLabel">,
): JSX.Element {
  return <IconButton icon={Pause} aria-label="pause" {...props} />;
}
