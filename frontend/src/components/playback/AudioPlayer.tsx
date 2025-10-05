import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { type JSX } from "react";

import {
  MuteToggle,
  PlaybackToggle,
  ProgressBar,
  StepButton,
  VolumeSlider,
} from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import { asClip, asTrack } from "@/contexts/playback/utils";
import { type UseClipperResult } from "@/hooks/useClipper";
import { trackDetailRoute } from "@/routes";

type AudioPlayerProps = {
  clipper: UseClipperResult;
};

export function AudioPlayer({ clipper }: AudioPlayerProps): JSX.Element {
  const {
    state: { playable },
  } = usePlaybackContext();

  const track = asTrack(playable);
  const clip = asClip(playable);
  const trackId = track?.id || clip?.trackId;

  return (
    <div data-testid="audio-player" className="flex flex-col space-y-4">
      <span
        className="text-center font-medium hover:underline"
        data-testid="audio-player-title"
      >
        {trackId ? (
          <Link
            to={trackDetailRoute.to}
            params={{ id: trackId }}
            className="hover:underline"
          >
            {playable?.title || ""}
          </Link>
        ) : (
          playable?.title || ""
        )}
      </span>
      <ProgressBar />
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="ml-1 flex flex-row items-center space-x-2">
          <VolumeSlider className="!min-h-9" orientation="vertical" />
          <MuteToggle size="icon-lg" />
        </div>

        <div className="flex flex-row items-center space-x-2">
          <StepButton variant="back" size="icon-lg" />
          <PlaybackToggle
            className="rounded-full border-2 !border-current"
            size="icon-lg"
            variant="outline"
          />
          <StepButton variant="forward" size="icon-lg" />
        </div>

        <div className="mr-1 flex flex-row items-center space-x-2">
          <IconButton
            icon={Scissors}
            onClick={clipper.actions.startClipping}
            disabled={!clipper.derived.isClippable}
            size="icon-lg"
          />
          <span className="w-[6px]"></span>
        </div>
      </div>
    </div>
  );
}
