import { useCallback, useEffect, useState } from "react";

import { getClip } from "@/api/clips";
import { getErrorMessage } from "@/lib/errorUtils";
import type { Clip } from "@/types";

type UseClipResult = {
  clip: Clip | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchData: () => Promise<void>;
};

export function useClip(id: string | undefined): UseClipResult {
  const [clip, setClip] = useState<Clip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const clip = await getClip(id);
      setClip(clip);
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
    clip,
    isLoading,
    errorMessage,
    fetchData,
  };
}
