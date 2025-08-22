import type { TrackResponse } from "@/api/types";
import type { Track } from "@/types";

export function mapTrackToInternal({
  id,
  updated_at,
  title,
  duration,
  format,
  size,
  recorded_date,
  url,
}: TrackResponse): Track {
  return {
    id,
    createdAt: new Date(updated_at),
    updatedAt: new Date(updated_at),
    title,
    duration,
    format,
    size,
    recordedDate: recorded_date !== null ? new Date(recorded_date) : null,
    url,
  };
}
