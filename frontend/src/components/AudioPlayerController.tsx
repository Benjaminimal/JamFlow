import { type JSX, useContext, useEffect } from "react";

import AudioPlayer from "@/components/AudioPlayer";
import { PlayableContext } from "@/contexts/PlayableContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export default function AudioPlayerController(): JSX.Element {
  const { playable } = useContext(PlayableContext);
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

  useEffect(() => {
    if (playable) {
      load(playable);
    }
  }, [playable, load]);

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
