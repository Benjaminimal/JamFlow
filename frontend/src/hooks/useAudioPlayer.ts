import { useState } from "react";

type UseAudioPlayerResult = {
  title: string;
  setTitle: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
};

export function useAudioPlayer(): UseAudioPlayerResult {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);

  return {
    title,
    setTitle,
    active,
    setActive,
  };
}
