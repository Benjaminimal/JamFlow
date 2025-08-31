import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Playable } from "@/types";

export type UseAudioPlayerResult = {
  load: (playable: Playable) => void;
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
  isLoading: boolean;
};

export function useAudioPlayer(): UseAudioPlayerResult {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, _setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    if (isPlaying) {
      intervalId = setInterval(syncPosition, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!playable) return;

    setActive(true);
    setIsLoading(true);
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

        setIsLoading(false);

        howl.play();
      },
      onloaderror: () => {
        console.error("Audio onloaderror");
        // TODO: handle error
      },
      onplay: () => {
        console.log("Audio onplay");

        setIsPlaying(true);
      },
      onplayerror: () => {
        console.error("Audio onplayerror");
        // TODO: handle error
      },
      onend: () => {
        console.log("Audio onend");

        setIsPlaying(false);
      },
      onpause: () => {
        console.log("Audio onpause");

        setIsPlaying(false);
      },
      onstop: () => {
        console.log("Audio onstop");

        setIsPlaying(false);
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
    isLoading,
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
