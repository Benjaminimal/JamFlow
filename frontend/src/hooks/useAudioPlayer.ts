import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Playable } from "@/types";

const AudioPlayerStatus = {
  Idle: "idle",
  Loading: "loading",
  Playing: "playing",
  Paused: "paused",
  Error: "error",
} as const;

type AudioPlayerStatus =
  (typeof AudioPlayerStatus)[keyof typeof AudioPlayerStatus];

export type UseAudioPlayerResult = {
  load: (playable: Playable) => void;
  isActive: boolean;
  isLoading: boolean;
  title: string;
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
  const [status, setStatus] = useState<AudioPlayerStatus>(
    AudioPlayerStatus.Idle,
  );
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, _setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [playable, setPlayable] = useState<Playable | null>(null);
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;

    const syncPosition = () => {
      const howl = howlRef.current;
      if (!howl || !howl.playing()) return;

      setPosition(secondsToMs(howl.seek()));
    };

    if (status == AudioPlayerStatus.Playing) {
      intervalId = setInterval(syncPosition, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status]);

  useEffect(() => {
    if (!playable) return;

    setStatus(AudioPlayerStatus.Loading);
    setTitle(playable.title);

    howlRef.current = new Howl({
      src: [playable.url],
      volume: percentToFactor(volume),
      mute: isMuted,
      onload: () => {
        console.log("Audio onload");

        const howl = howlRef.current;
        if (!howl) return;

        const _duration = secondsToMs(howl.duration());
        setDuration(_duration);

        setPosition(0);

        howl.play();
      },
      onloaderror: () => {
        console.error("Audio onloaderror");

        setStatus(AudioPlayerStatus.Error);
        // TODO: handle error
      },
      onplay: () => {
        console.log("Audio onplay");

        setStatus(AudioPlayerStatus.Playing);
      },
      onplayerror: () => {
        console.error("Audio onplayerror");

        setStatus(AudioPlayerStatus.Error);
        // TODO: handle error
      },
      onend: () => {
        console.log("Audio onend");

        setStatus(AudioPlayerStatus.Paused);
      },
      onpause: () => {
        console.log("Audio onpause");

        setStatus(AudioPlayerStatus.Paused);
      },
      onstop: () => {
        console.log("Audio onstop");

        setStatus(AudioPlayerStatus.Paused);
      },
      onseek: () => {
        console.log("Audio onseek");

        const howl = howlRef.current;
        if (!howl) return;

        setPosition(secondsToMs(howl.seek()));
      },
      onmute: () => {
        console.log("Audio onmute");

        const howl = howlRef.current;
        if (!howl) return;

        setIsMuted(howl.mute());
      },
      onvolume: () => {
        console.log("Audio onvolume");

        const howl = howlRef.current;
        if (!howl) return;

        _setVolume(factorToPercent(howl.volume()));
      },
    });
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playable]); // volume and isMuted are only needed at init

  const load = useCallback(
    (p: Playable) => {
      if (playable?.id === p.id) return;

      setPlayable(p);
    },
    [playable],
  );

  const togglePlay = () => {
    const howl = howlRef.current;
    if (!howl) return;

    if (howl.playing()) {
      howl.pause();
    } else {
      howl.play();
    }
  };

  const toggleMute = () => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.mute(!isMuted);
  };

  const setVolume = (v: number) => {
    const howl = howlRef.current;
    if (!howl) return;

    const nextVolume = Math.max(0, Math.min(100, v));
    howl.volume(percentToFactor(nextVolume));
  };

  const seek = (v: number) => {
    const howl = howlRef.current;
    if (!howl) return;

    const nextPosition = Math.max(0, Math.min(duration, v));
    howl.seek(msToSeconds(nextPosition));
  };

  const isActive = status !== AudioPlayerStatus.Idle;
  const isPlaying = status === AudioPlayerStatus.Playing;
  const isLoading = status === AudioPlayerStatus.Loading;

  return {
    load,
    isActive,
    isLoading,
    title,
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

function msToSeconds(ms: number) {
  return ms / 1000;
}
function secondsToMs(seconds: number) {
  return Math.round(seconds * 1000);
}

function percentToFactor(percent: number) {
  return percent / 100;
}

function factorToPercent(factor: number) {
  return Math.round(factor * 100);
}
