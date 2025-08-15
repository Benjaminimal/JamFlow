import { useEffect, useState } from "react";

import { listTracks } from "@/api/tracks";
import type { Track } from "@/types";

type UseTrackListResult = {
  tracks: Track[];
  loading: boolean;
};
export function useTrackList(): UseTrackListResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startFetching = async () => {
      setLoading(true);
      setTracks(await listTracks());
      setLoading(false);
    };

    startFetching();
  }, []);

  return {
    tracks,
    loading,
  };
}
