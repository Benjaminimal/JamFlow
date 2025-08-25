import { useState } from "react";

import type { Playable } from "@/types";

type UseAudioPlayerResult = {
  load: (playable: Playable) => Promise<void>;
  title: string;
  active: boolean;
  duration: number;
  position: number;
  seek: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  isMuted: boolean;
  toggleMute: () => void;
};

export function useAudioPlayer(): UseAudioPlayerResult {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, _setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const load = async (playable: Playable) => {
    setActive(true);
    setTitle(playable.title);
    setDuration(playable.duration);
    seek(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setVolume = (v: number) => {
    _setVolume(Math.max(0, Math.min(100, v)));
  };

  const seek = (v: number) => {
    setPosition(Math.max(0, Math.min(duration, v)));
  };

  return {
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
  };
}
