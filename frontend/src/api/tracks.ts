import { mapAxiosError } from "@api/errorHandler";
import type { TrackCreateResponse } from "@api/types";
import axios from "axios";

import type { Track, TrackCreateForm } from "@/types";

export async function uploadTrack({
  title,
  recordedDate,
  uploadFile,
}: TrackCreateForm): Promise<Track> {
  const formData = new FormData();
  formData.append("upload_file", uploadFile as Blob);
  formData.append("title", title);
  if (recordedDate) {
    formData.append("recorded_date", recordedDate);
  }

  try {
    const response = await axios.post<TrackCreateResponse>(
      "http://localhost:8000/api/v1/tracks",
      formData,
    );
    return mapTrackApiToInternal(response.data);
  } catch (error) {
    throw mapAxiosError(error);
  }
}

function mapTrackApiToInternal({
  id,
  updated_at,
  title,
  duration,
  format,
  size,
  recorded_date,
  url,
}: TrackCreateResponse): Track {
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
