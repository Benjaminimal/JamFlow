import { createContext } from "react";

import { ApplicationError } from "@/errors";
import type { UseAudioPlayerResult } from "@/hooks/useAudioPlayer";

export type AudioPlayerContextType = UseAudioPlayerResult;

export const AudioPlayerContext = createContext<AudioPlayerContextType>({
  load: () => {
    throw new ApplicationError("load called outside of AudioPlayerProvider");
  },
  // TODO: review AI slop
  title: "",
  active: false,
  duration: 0,
  position: 0,
  seek: () => {
    throw new ApplicationError("seek called outside of AudioPlayerProvider");
  },
  volume: 75,
  setVolume: () => {
    throw new ApplicationError(
      "setVolume called outside of AudioPlayerProvider",
    );
  },
  isPlaying: false,
  togglePlay: () => {
    throw new ApplicationError(
      "togglePlay called outside of AudioPlayerProvider",
    );
  },
  isMuted: false,
  toggleMute: () => {
    throw new ApplicationError(
      "toggleMute called outside of AudioPlayerProvider",
    );
  },
  isLoading: false,
});
