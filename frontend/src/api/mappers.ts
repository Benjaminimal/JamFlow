import type { ClipResponse, TrackResponse } from "@/api/types";
import type { Clip, Track } from "@/types";

export function mapTrackToInternal({
  created_at,
  updated_at,
  recorded_date,
  url,
  ...rest
}: TrackResponse): Track {
  return {
    createdAt: new Date(created_at),
    updatedAt: new Date(updated_at),
    recordedDate: recorded_date !== null ? new Date(recorded_date) : null,
    url,
    ...rest,
  };
}

export function mapClipToInternal({
  created_at,
  updated_at,
  ...rest
}: ClipResponse): Clip {
  return {
    createdAt: new Date(created_at),
    updatedAt: new Date(updated_at),
    trackId: rest.track_id,
    ...rest,
  };
}
