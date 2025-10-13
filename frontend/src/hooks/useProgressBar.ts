import { useEffect, useState } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { PlaybackEvent } from "@/contexts/playback/types";

export type UseProgressBarResult = {
  playbackPosition: number;
  duration: number;
  isSeeking: boolean;
  setIsSeeking: (value: boolean) => void;
  seekTarget: number;
  setSeekTarget: (value: number) => void;
  seek: (position: number) => void;
};

export function useProgressBar() {
  const {
    state: { duration },
    actions: { seek, subscribe },
  } = usePlaybackContext();
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [seekTarget, setSeekTarget] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    const syncPosition = (event: PlaybackEvent) => {
      if (event.type !== "progress") return;
      const position = isSeeking ? seekTarget : event.position;

      setPlaybackPosition(position);
    };

    const unsubscribe = subscribe(syncPosition);

    return () => unsubscribe();
  }, [isSeeking, seekTarget, subscribe]);

  return {
    playbackPosition,
    duration,
    isSeeking,
    setIsSeeking,
    seekTarget,
    setSeekTarget,
    seek,
  };
}
