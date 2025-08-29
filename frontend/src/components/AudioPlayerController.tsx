import { type JSX, useContext } from "react";

import AudioPlayer from "@/components/AudioPlayer";
import { AudioPlayerContext } from "@/contexts/AudioPlayerContext";

export default function AudioPlayerController(): JSX.Element {
  const {
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
  } = useContext(AudioPlayerContext);

  return (
    <>
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
    </>
  );
}
