import { X } from "lucide-react";
import { type JSX } from "react";

import { ClipperControls } from "@/components/clipper";
import { PlaybackToggle, ProgressBar } from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import { type UseClipperResult } from "@/hooks/useClipper";

type ClipperProps = {
  clipper: UseClipperResult;
};

export function Clipper({ clipper }: ClipperProps): JSX.Element {
  const {
    state: { playable },
  } = usePlaybackContext();

  return (
    <div data-testid="clipper" className="flex flex-col space-y-4">
      <div className="text-center font-medium" data-testid="audio-player-title">
        {playable?.title || ""}
        <IconButton icon={X} onClick={clipper.actions.cancelClipping} />
      </div>
      <div className="space-y-2">
        <ClipperControls clipper={clipper} />
        <ProgressBar />
      </div>
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="ml-1 flex flex-row items-center space-x-2">P</div>
        <PlaybackToggle
          className="rounded-full border-2 !border-current"
          size="icon-lg"
          variant="outline"
        />
        <div className="mr-1 flex flex-row items-center space-x-2">P</div>
      </div>
    </div>
  );
}
