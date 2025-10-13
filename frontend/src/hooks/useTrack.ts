import { useCallback, useEffect, useState } from "react";

import { getTrack } from "@/api/tracks";
import { getErrorMessage } from "@/lib/errorUtils";
import type { Track } from "@/types";

type UseTrackResult = {
  track: Track | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchData: () => Promise<void>;
};

export function useTrack(id: string | undefined): UseTrackResult {
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const track = await getTrack(id);
      setTrack(track);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    track,
    isLoading,
    errorMessage,
    fetchData,
  };
}
