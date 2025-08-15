import type { JSX } from "react";

import { useTrackList } from "@/hooks/useTrackList";

export default function TrackList(): JSX.Element {
  const { tracks, loading } = useTrackList();
  if (loading)
    return (
      <>
        <p>Loading...</p>
      </>
    );
  if (tracks.length === 0)
    return (
      <>
        <p>No tracks found</p>
      </>
    );
  return <></>;
}
