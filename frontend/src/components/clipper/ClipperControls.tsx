import { Save } from "lucide-react";
import { type JSX, useState } from "react";

import {
  ClipperBar,
  ClipperBounds,
  ClipperButtons,
  ClipperRuler,
  type DraggingThumb,
  Timecode,
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
  const displayDuration = clipDisplayBounds.end - clipDisplayBounds.start;

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
      <div className="mt-2 flex flex-row items-center justify-between">
        <div className="flex flex-col items-center space-y-1">
          <Timecode time={clipDisplayBounds.start} />
          <ClipperButtons
            variant="start"
            stepBack={() => nudgeStart("backward")}
            stepForward={() => nudgeStart("forward")}
            replay={playStart}
          />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <Timecode time={displayDuration} />
          <IconButton icon={Save} onClick={save} disabled={isSubmitting} />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <Timecode time={clipDisplayBounds.start} />
          <ClipperButtons
            variant="end"
            stepBack={() => nudgeEnd("backward")}
            stepForward={() => nudgeEnd("forward")}
            replay={playEnd}
          />
        </div>
      </div>
    </div>
  );
}
