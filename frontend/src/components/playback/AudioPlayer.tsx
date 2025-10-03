import { Scissors } from "lucide-react";
import { type JSX } from "react";
import { Link } from "react-router-dom";

import {
  MuteToggle,
  PlaybackToggle,
  ProgressBar,
  VolumeSlider,
} from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import { type UseClipperResult } from "@/hooks/useClipper";
import { pathGenerator } from "@/routes";

type AudioPlayerProps = {
  clipper: UseClipperResult;
};

export function AudioPlayer({ clipper }: AudioPlayerProps): JSX.Element {
  const {
    state: { playable },
  } = usePlaybackContext();
  return (
    <div data-testid="audio-player" className="flex flex-col space-y-4">
      <Link
        to={playable ? pathGenerator.trackDetail({ id: playable.id }) : "#"}
        state={{ track: playable }}
        className="text-center font-medium hover:underline"
        data-testid="audio-player-title"
      >
        {playable?.title || ""}
      </Link>
      <ProgressBar />
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="ml-1 flex flex-row items-center space-x-2">
          <VolumeSlider className="!min-h-9" orientation="vertical" />
          <MuteToggle />
        </div>
        <PlaybackToggle
          className="rounded-full border-2 !border-current"
          size="icon-lg"
          variant="outline"
        />
        <div className="mr-1 flex flex-row items-center space-x-2">
          <IconButton
            icon={Scissors}
            onClick={clipper.actions.startClipping}
            disabled={!clipper.derived.isClippable}
          />
          <span className="w-[6px]"></span>
        </div>
      </div>
    </div>
  );
}
