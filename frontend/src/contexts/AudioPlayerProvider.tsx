import type { JSX, ReactNode } from "react";

import AudioPlayer from "@/components/AudioPlayer";
import { AudioPlayerContext } from "@/contexts/AudioPlayerContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export default function AudioPlayerProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const {
    load,
    title,
    active,
    duration,
    position,
    seek,
    volume,
    setVolume,
    isPlaying,
    togglePlay,
    isMuted,
    toggleMute,
    isLoading,
  } = useAudioPlayer();

  // TODO: pull this out into a separate smart component
  return (
    <AudioPlayerContext.Provider value={{ load }}>
      {children}
      {active && (
        //  TODO: remove debug styling
        <div
          style={{
            borderTop: "2px solid #fff",
          }}
        >
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <AudioPlayer
              title={title}
              duration={duration}
              position={position}
              onPositionChange={seek}
              volume={volume}
              onVolumeChange={setVolume}
              isPlaying={isPlaying}
              onPlayToggle={togglePlay}
              isMuted={isMuted}
              onMuteToggle={toggleMute}
            />
          )}
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}
