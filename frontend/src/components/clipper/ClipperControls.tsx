import { Save } from "lucide-react";
import { type JSX, useCallback, useEffect, useState } from "react";

import {
  ClipperBar,
  ClipperBounds,
  ClipperButtons,
  ClipperRuler,
  type DraggingThumb,
} from "@/components/clipper";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { MAX_CLIP_DURATION, type UseClipperResult } from "@/hooks/useClipper";
import { formatDuration } from "@/lib/time";

const RULER_MARKER_DISTANCE = 60_000;
const STEP_SIZE = 500;

type ClipperControlsProps = {
  clipper: UseClipperResult;
  save: () => Promise<void>;
};

export function ClipperControls({
  clipper,
  save,
}: ClipperControlsProps): JSX.Element {
  const {
    state: { duration },
    actions: { getPosition, subscribe, seek },
  } = usePlaybackContext();

  const {
    state: { start: clipStart, end: clipEnd },
    actions: { playStart, setStart, playEnd, setEnd },
    derived: { isSubmitting },
  } = clipper;

  // TODO: think about how much reverse padding from current position is good UX
  const getViewBounds = useCallback(() => {
    const padding = 30_000;
    const windowDuration = MAX_CLIP_DURATION + 2 * padding;
    const start = Math.max(0, getPosition() - padding);
    const end = Math.min(duration, start + windowDuration);
    return { start, end };
  }, [getPosition, duration]);

  const [viewBounds, setViewBounds] = useState(getViewBounds);

  // Update view bounds on seek events
  useEffect(() => {
    const handleSeek = (event: PlaybackEvent) => {
      if (event.type !== "seek") return;

      // TODO: it would be a lot more usable to set new bound on UI seek
      // instead of checking bounds
      if (event.target < viewBounds.start || event.target > viewBounds.end) {
        setViewBounds(getViewBounds());
      }
    };

    const unsubscribe = subscribe(handleSeek);
    return () => unsubscribe();
  }, [subscribe, viewBounds, getViewBounds]);

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

  const stepBack = (from: number, setter: (v: number) => void) => {
    const nextStart = Math.max(viewBounds.start, from - STEP_SIZE);
    setter(nextStart);
  };
  const stepForward = (from: number, setter: (v: number) => void) => {
    const nextStart = Math.min(viewBounds.end, from + STEP_SIZE);
    setter(nextStart);
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
      <div className="mt-2 flex flex-row items-center justify-between">
        <div className="flex flex-col items-center space-y-1">
          <div className="text-muted-foreground text-xs">
            {formatDuration(clipDisplayBounds.start)}
          </div>
          <ClipperButtons
            variant="start"
            stepBack={() => stepBack(clipStart, setStart)}
            stepForward={() => stepForward(clipStart, setStart)}
            replay={playStart}
          />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="text-muted-foreground flex items-center text-xs">
            {formatDuration(displayDuration)}
          </div>

          <IconButton icon={Save} onClick={save} disabled={isSubmitting} />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="text-muted-foreground text-xs">
            {formatDuration(clipDisplayBounds.end)}
          </div>
          <ClipperButtons
            variant="end"
            stepBack={() => stepBack(clipEnd, setEnd)}
            stepForward={() => stepForward(clipEnd, setEnd)}
            replay={playEnd}
          />
        </div>
      </div>
    </div>
  );
}
