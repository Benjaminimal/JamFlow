import type { AudioFormat } from "@/api/types";

export type TrackCreateForm = {
  title: string;
  recordedDate: string | null;
  file: File;
};

export type Track = {
  kind: "track";
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  duration: number; // milliseconds
  format: AudioFormat;
  size: number; // bytes
  url: string;
  recordedDate: Date | null;
};

export type Clip = {
  kind: "clip";
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  duration: number; // milliseconds
  format: AudioFormat;
  size: number; // bytes
  url: string;
  trackId: string;
  start: number; // milliseconds
  end: number; // milliseconds
};

export type SubmitResult = {
  success: boolean;
  error?: unknown;
};
