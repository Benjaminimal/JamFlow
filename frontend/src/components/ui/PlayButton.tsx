import { Play } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { IconButton } from "@/components/primitives";

export function PlayButton(
  props: Omit<ComponentProps<typeof IconButton>, "icon" | "ariaLabel">,
): JSX.Element {
  return <IconButton icon={Play} ariaLabel="play" {...props} />;
}
