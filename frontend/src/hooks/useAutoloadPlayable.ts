import { useEffect, useRef } from "react";

import { usePlaybackContext } from "@/contexts/playback";
import type { Playable } from "@/contexts/playback/types";
import { isSamePlayable } from "@/contexts/playback/utils";
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
  const { track: playableToLoad, errorMessage } = useTrack(playableId);

  const lastLoadedIdRef = useRef<string | undefined>(undefined);

  if (kind === "clip") {
    // TODO: implement clip loading
    throw new Error("Not implemented");
  }

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
