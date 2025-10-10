import { apiClient } from "@/api/client";
import { mapAxiosError } from "@/api/errorHandler";
import { mapTrackToInternal } from "@/api/mappers";
import type { TrackResponse } from "@/api/types";
import type { Track, TrackCreateForm } from "@/types";

const resource = "/tracks";

export async function uploadTrack({
  title,
  recordedDate,
  file,
}: TrackCreateForm): Promise<Track> {
  const formData = new FormData();
  formData.append("upload_file", file as Blob);
  formData.append("title", title);
  if (recordedDate) {
    formData.append("recorded_date", recordedDate);
  }

  try {
    const response = await apiClient.post<TrackResponse>(resource, formData);
    return mapTrackToInternal(response.data);
  } catch (error) {
    throw mapAxiosError(error);
  }
}

export async function getTrack(id: string): Promise<Track> {
  try {
    const response = await apiClient.get<TrackResponse>(`${resource}/${id}`);
    return mapTrackToInternal(response.data);
  } catch (error) {
    throw mapAxiosError(error);
  }
}

export async function listTracks(): Promise<Track[]> {
  try {
    const response = await apiClient.get<TrackResponse[]>(resource);
    return response.data.map(mapTrackToInternal);
  } catch (error) {
    throw mapAxiosError(error);
  }
}
