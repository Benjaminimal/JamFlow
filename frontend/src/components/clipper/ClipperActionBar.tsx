import { type JSX, type ReactNode } from "react";

import { Timecode } from "@/components/clipper";
import type { Bounds } from "@/components/clipper/types";

type ClipperActionBarProps = {
  clipBounds: Bounds;
  startActions: ReactNode;
  durationActions: ReactNode;
  endActions: ReactNode;
};

export function ClipperActionBar({
  clipBounds,
  startActions,
  durationActions,
  endActions,
}: ClipperActionBarProps): JSX.Element {
  const clipDuration = clipBounds.end - clipBounds.start;

  return (
    <div className="mt-2 flex flex-row items-center justify-between">
      <ActionControls time={clipBounds.start} actions={startActions} />
      <ActionControls time={clipDuration} actions={durationActions} />
      <ActionControls time={clipBounds.end} actions={endActions} />
    </div>
  );
}

type ActionControlsProps = {
  time: number;
  actions: ReactNode;
};

function ActionControls({ time, actions }: ActionControlsProps): JSX.Element {
  return (
    <div className="flex flex-col items-center space-y-2">
      <Timecode time={time} />
      {actions}
    </div>
  );
}
