export type AudioFormat = "mp3" | "wav" | "ogg";

export type TrackCreateRequest = {
  title: string;
  recorded_date?: string | null;
  upload_file: File;
};

export type TrackResponse = {
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

// NOTE: these error types are currently not used
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BUSINESS_RULE_VIOLATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ErrorResponse = {
  code: ErrorCode;
  timestamp: string;
  details: ErrorDetail[];
};

export type ErrorDetail = {
  message: string;
  field: string | null;
};
