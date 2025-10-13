import { useEffect, useRef } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { Playable } from "@/contexts/playback/types";
import { isSamePlayable } from "@/contexts/playback/utils";
import { useClip } from "@/hooks/useClip";
import { useTrack } from "@/hooks/useTrack";

type PlayableKind = Playable["kind"];

export type UsePlayableFromSearchResult = {
  errorMessage: string | null;
};

export function useAutoloadPlayable(
  kind: PlayableKind,
  playableId: string | undefined,
): UsePlayableFromSearchResult {
  const {
    state: { playable },
    actions: { load },
  } = usePlaybackContext();
  const trackId = kind === "track" ? playableId : undefined;
  const clipId = kind === "clip" ? playableId : undefined;

  const { track, errorMessage: trackErrorMessage } = useTrack(trackId);
  const { clip, errorMessage: clipErrorMessage } = useClip(clipId);

  const playableToLoad = kind === "track" ? track : clip;
  const errorMessage = kind === "track" ? trackErrorMessage : clipErrorMessage;

  const lastLoadedIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!playableToLoad) return;
    if (isSamePlayable(playable, playableToLoad)) return;
    if (playableToLoad.id === lastLoadedIdRef.current) return;

    load(playableToLoad);
    lastLoadedIdRef.current = playableToLoad.id;
  }, [playableToLoad, playable, load]);

  return {
    errorMessage,
  };
}
