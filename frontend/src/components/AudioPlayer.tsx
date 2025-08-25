import type { JSX } from "react";

type AudioPlayerProps = {
  title: string;
};
export default function AudioPlayer({ title }: AudioPlayerProps): JSX.Element {
  return <div data-testid="audio-player">{title}</div>;
}
