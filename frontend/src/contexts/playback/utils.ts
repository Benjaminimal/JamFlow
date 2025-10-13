import type { Playable } from "@/contexts/playback/types";
import type { Clip, Track } from "@/types";

export function isTrack(
  playable: Playable | null | undefined,
): playable is Track {
  return playable?.kind === "track";
}

export function isClip(
  playable: Playable | null | undefined,
): playable is Clip {
  return playable?.kind === "clip";
}

export function asTrack(playable: Playable | null | undefined): Track | null {
  return isTrack(playable) ? playable : null;
}

export function asClip(playable: Playable | null | undefined): Clip | null {
  return isClip(playable) ? playable : null;
}

export function isSameTrack(
  a: Track | null | undefined,
  b: Track | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id;
}

export function isSameClip(
  a: Clip | null | undefined,
  b: Clip | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id;
}

export function isSamePlayable(
  a: Playable | null | undefined,
  b: Playable | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.kind === b.kind && a.id === b.id;
}
