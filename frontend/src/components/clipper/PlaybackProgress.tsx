import { type JSX, useEffect, useState } from "react";

import type { Bounds } from "@/components/clipper/types";
import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";
import { timeToPositionPercent } from "@/lib/time";

type ProgressLineProps = {
  viewBounds: Bounds;
};

export function PlaybackProgress({
  viewBounds,
}: ProgressLineProps): JSX.Element {
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const {
    actions: { subscribe },
  } = usePlaybackContext();

  useEffect(() => {
    const syncPosition = (event: PlaybackEvent) => {
      if (event.type !== "progress") return;
      setPlaybackPosition(event.position);
    };

    const unsubscribe = subscribe(syncPosition);

    return () => unsubscribe();
  }, [subscribe]);

  const offset = timeToPositionPercent(
    playbackPosition,
    viewBounds.start,
    viewBounds.end,
  );

  return (
    <div
      className="absolute top-0 h-full w-[2px] bg-yellow-500"
      style={{
        left: `${offset}%`,
      }}
    ></div>
  );
}
