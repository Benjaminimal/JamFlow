import { type TrackDetailParams } from "@/pages/TrackDetail";

export const pathGenerator = {
  root: () => `/`,
  trackList: () => `/`,
  trackDetail: (params: TrackDetailParams) => `/tracks/${params.id}`,
} as const;
