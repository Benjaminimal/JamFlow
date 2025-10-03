import { useEffect, useState } from "react";

import { listTracks } from "@/api/tracks";
import { getErrorMessage } from "@/lib/errorUtils";
import type { Track } from "@/types";

type UseTrackListResult = {
  tracks: Track[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchData: () => Promise<void>;
};

export function useTrackList(): UseTrackListResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const tracks = await listTracks();
      setTracks(tracks);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    tracks,
    isLoading,
    errorMessage,
    fetchData,
  };
}
