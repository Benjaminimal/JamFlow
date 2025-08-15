import { useState } from "react";

import type { Track } from "@/types";

type UseTrackListResult = {
  tracks: Track[];
};
export function useTrackList(): UseTrackListResult {
  const [tracks, _] = useState<Track[]>([]);
  return {
    tracks,
  };
}
