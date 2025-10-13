import { type JSX } from "react";

import { Clipper } from "@/components/clipper";
import { AudioPlayer } from "@/components/playback";
import { ErrorState, LoadingState } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { useClipper } from "@/hooks/useClipper";

export function AudioPlayerContainer(): JSX.Element | null {
  const { derived } = usePlaybackContext();
  const clipper = useClipper();

  if (derived.isIdle) return null;
  if (derived.isError) return <ErrorDisplay />;
  if (derived.isLoading) return <LoadingState />;
  if (!clipper.derived.isIdle) return <Clipper clipper={clipper} />;
  return <AudioPlayer clipper={clipper} />;
}

function ErrorDisplay(): JSX.Element {
  const {
    state: { errorMessage, playable },
    actions: { load },
  } = usePlaybackContext();
  return (
    <ErrorState
      message={errorMessage}
      onRetry={() => playable && load(playable)}
    />
  );
}
