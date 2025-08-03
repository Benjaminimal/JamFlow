import type { AudioFormat } from "@api/types";

export type TrackCreateForm = {
  title: string;
  recordedDate?: string | null;
  uploadFile: File;
};

export type Track = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  duration: number; // milliseconds
  format: AudioFormat;
  size: number; // bytes
  recordedDate: Date | null;
  url: string;
};
