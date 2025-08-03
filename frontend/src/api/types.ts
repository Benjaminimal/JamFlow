export type AudioFormat = "mp3" | "wav" | "ogg";

export type TrackCreateRequest = {
  title: string;
  recorded_date?: string | null;
  upload_file: File;
};

export type TrackCreateResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  duration: number; // milliseconds
  format: AudioFormat;
  size: number; // bytes
  recorded_date: string | null;
  url: string;
};
