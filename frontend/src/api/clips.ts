import { apiClient } from "@/api/client";
import { mapAxiosError } from "@/api/errorHandler";
import { mapClipToInternal } from "@/api/mappers";
import type { ClipCreateRequest, ClipResponse, QueryParams } from "@/api/types";
import type { Clip } from "@/types";

export async function postClip({
  track_id,
  title,
  start,
  end,
}: ClipCreateRequest): Promise<Clip> {
  try {
    const response = await apiClient.post<ClipResponse>("/clips", {
      track_id,
      title,
      start,
      end,
    });
    return mapClipToInternal(response.data);
  } catch (error) {
    throw mapAxiosError(error);
  }
}

export async function getClip(id: string): Promise<Clip> {
  try {
    const response = await apiClient.get<ClipResponse>(`/clips/${id}`);
    return mapClipToInternal(response.data);
  } catch (error) {
    throw mapAxiosError(error);
  }
}

export async function listClips(trackId?: string): Promise<Clip[]> {
  const params: QueryParams = {};
  if (trackId) {
    params.track_id = trackId;
  }

  try {
    const response = await apiClient.get<ClipResponse[]>("/clips", {
      params,
    });
    return response.data.map(mapClipToInternal);
  } catch (error) {
    throw mapAxiosError(error);
  }
}
