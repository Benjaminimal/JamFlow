import { RotateCcw, RotateCw, Save } from "lucide-react";
import { type JSX, useState } from "react";

import {
  ClipperActionBar,
  ClipperBar,
  ClipperBoundControls,
  ClipperBounds,
  ClipperRuler,
  type DraggingThumb,
} from "@/components/clipper";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import { type UseClipperResult } from "@/hooks/useClipper";
import { useClipperViewBounds } from "@/hooks/useClipperViewBounds";

const RULER_MARKER_DISTANCE = 60_000;

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
    actions: { playStart, playEnd },
    derived: { isSubmitting },
  } = clipper;

  const { viewBounds, nudgeStart, nudgeEnd } = useClipperViewBounds(clipper);

  const [draggingThumb, setDraggingThumb] = useState<DraggingThumb | null>(
    null,
  );
  const [startTarget, setStartTarget] = useState(clipStart);
  const [endTarget, setEndTarget] = useState(clipEnd);

  const clipDisplayBounds = {
    start: draggingThumb === "start" ? startTarget : clipStart,
    end: draggingThumb === "end" ? endTarget : clipEnd,
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="my-8">
        <div className="relative w-full space-y-2">
          <ClipperBounds
            clipper={clipper}
            viewBounds={viewBounds}
            draggingThumb={draggingThumb}
            setDraggingThumb={setDraggingThumb}
            startTarget={startTarget}
            setStartTarget={setStartTarget}
            endTarget={endTarget}
            setEndTarget={setEndTarget}
            seek={seek}
          />
          <ClipperBar viewBounds={viewBounds} clipBounds={clipDisplayBounds} />
          <ClipperRuler
            viewBounds={viewBounds}
            markerDistance={RULER_MARKER_DISTANCE}
          />
        </div>
      </div>
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
