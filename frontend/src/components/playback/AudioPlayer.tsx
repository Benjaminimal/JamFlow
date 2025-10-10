import { Link as LinkIcon, Scissors } from "lucide-react";
import { type JSX } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  MuteToggle,
  PlaybackToggle,
  ProgressBar,
  StepButton,
  VolumeSlider,
} from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { usePlaybackContext } from "@/contexts/playback";
import type { Playable } from "@/contexts/playback/types";
import { asClip, asTrack } from "@/contexts/playback/utils";
import { type UseClipperResult } from "@/hooks/useClipper";
import { copyToClipboard } from "@/lib/clipboard";
import { urlGenerator } from "@/routing";

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

  const isShareable = !!playable;
  const handleShare = async () => {
    if (!isShareable) return;
    const shared = await sharePlayable(playable);
    if (shared) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Failed to link copy to clipboard");
    }
  };

  return (
    <div data-testid="audio-player" className="flex flex-col space-y-4">
      <Link
        to={trackId ? urlGenerator.trackDetail({ id: trackId }) : "#"}
        state={{ track }}
        className="text-center font-medium hover:underline"
        data-testid="audio-player-title"
      >
        {playable?.title || ""}
      </Link>
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
            icon={LinkIcon}
            onClick={handleShare}
            disabled={!isShareable}
            size="icon-lg"
          />
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

async function sharePlayable(playable: Playable): Promise<boolean> {
  let shareUrl: string;
  switch (playable.kind) {
    case "track": {
      shareUrl = urlGenerator.trackList(
        { sharedTrackId: playable.id },
        { absolute: true },
      );
      break;
    }
    case "clip": {
      shareUrl = urlGenerator.trackDetail(
        { id: playable.trackId },
        { sharedClipId: playable.id },
        { absolute: true },
      );
      break;
    }
  }

  return await copyToClipboard(shareUrl);
}
