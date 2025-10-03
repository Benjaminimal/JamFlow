import { useCallback, useEffect, useState } from "react";

import { listClips } from "@/api/clips";
import { getErrorMessage } from "@/lib/errorUtils";
import type { Clip } from "@/types";

type UseClipListResult = {
  clips: Clip[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchData: () => Promise<void>;
};

export function useClipList(trackId: string | undefined): UseClipListResult {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const clips = await listClips(trackId);
      setClips(clips);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    clips,
    isLoading,
    errorMessage,
    fetchData,
  };
}
