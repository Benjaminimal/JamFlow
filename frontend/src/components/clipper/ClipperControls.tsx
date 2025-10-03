import { RotateCcw, RotateCw, Save } from "lucide-react";
import { type JSX, useState } from "react";

import {
  ClipperActionBar,
  ClipperBoundControls,
  ClipperTimeline,
} from "@/components/clipper";
import type { DraggingThumb } from "@/components/clipper/types";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import { type UseClipperResult } from "@/hooks/useClipper";
import { useClipperViewBounds } from "@/hooks/useClipperViewBounds";

const NUDGE_STEP = 0.5 * 1_000;

type NudgeDirection = "forward" | "backward";

type ClipperControlsProps = {
  clipper: UseClipperResult;
  save: () => Promise<void>;
};

export function ClipperControls({
  clipper,
  save,
}: ClipperControlsProps): JSX.Element {
  const {
    actions: { seek },
  } = usePlaybackContext();

  const {
    state: { start: clipStart, end: clipEnd },
    actions: { playStart, playEnd, setStart, setEnd },
    derived: { isSubmitting },
  } = clipper;

  const { viewBounds } = useClipperViewBounds();

  const [draggingThumb, setDraggingThumb] = useState<DraggingThumb | null>(
    null,
  );
  const [startTarget, setStartTarget] = useState(clipStart);
  const [endTarget, setEndTarget] = useState(clipEnd);

  const clipDisplayBounds = {
    start: draggingThumb === "start" ? startTarget : clipStart,
    end: draggingThumb === "end" ? endTarget : clipEnd,
  };

  const nudge = (
    value: number,
    setter: (v: number) => void,
    direction: NudgeDirection,
  ): void => {
    const delta = direction === "forward" ? NUDGE_STEP : -NUDGE_STEP;
    const nudgedValue = value + delta;
    const clamper = (v: number) =>
      direction === "backward"
        ? Math.max(viewBounds.start, v)
        : Math.min(viewBounds.end, v);
    const nextValue = clamper(nudgedValue);
    setter(nextValue);
  };

  const nudgeStart = (d: NudgeDirection) => nudge(clipStart, setStart, d);
  const nudgeEnd = (d: NudgeDirection) => nudge(clipEnd, setEnd, d);

  return (
    <div className="flex flex-col space-y-2">
      <ClipperTimeline
        clipper={clipper}
        draggingThumb={draggingThumb}
        setDraggingThumb={setDraggingThumb}
        startTarget={startTarget}
        setStartTarget={setStartTarget}
        endTarget={endTarget}
        setEndTarget={setEndTarget}
        seek={seek}
        viewBounds={viewBounds}
      />
      <ClipperActionBar
        clipBounds={clipDisplayBounds}
        startActions={
          <ClipperBoundControls
            onNudgeBack={() => nudgeStart("backward")}
            onNudgeForward={() => nudgeStart("forward")}
            onReplay={playStart}
            replayIcon={RotateCcw}
          />
        }
        durationActions={<SaveButton onClick={save} disabled={isSubmitting} />}
        endActions={
          <ClipperBoundControls
            onNudgeBack={() => nudgeEnd("backward")}
            onNudgeForward={() => nudgeEnd("forward")}
            onReplay={playEnd}
            replayIcon={RotateCw}
          />
        }
      />
    </div>
  );
}

type SaveButtonProps = {
  onClick: () => Promise<void>;
  disabled: boolean;
};

function SaveButton({ onClick, disabled }: SaveButtonProps): JSX.Element {
  return (
    <IconButton
      icon={Save}
      onClick={onClick}
      disabled={disabled}
      size="icon-lg"
    />
  );
}
