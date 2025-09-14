import { VolumeX } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";

export function UnmuteButton(
  props: Omit<ComponentProps<typeof IconButton>, "icon" | "ariaLabel">,
): JSX.Element {
  return <IconButton icon={VolumeX} ariaLabel="unmute" {...props} />;
}
