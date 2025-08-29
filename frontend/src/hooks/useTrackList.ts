import { useEffect, useState } from "react";

import { getUserFriendlyErrorMessage } from "@/api/errorHandler";
import { listTracks } from "@/api/tracks";
import type { Track } from "@/types";

type UseTrackListResult = {
  tracks: Track[];
  loading: boolean;
  errorMessage: string | null;
  fetchData: () => Promise<void>;
};

export function useTrackList(): UseTrackListResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  // TODO: consistent naming for states like this `isLoading, setIsLoading`
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const tracks = await listTracks();
      setTracks(tracks);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    tracks,
    loading,
    errorMessage,
    fetchData,
  };
}
