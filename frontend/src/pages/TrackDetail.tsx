import type { JSX } from "react";
import { useParams } from "react-router-dom";

import type { Track } from "@/types";

export type TrackDetailParams = Pick<Track, "id">;

export function TrackDetail(): JSX.Element {
  const { id } = useParams<TrackDetailParams>();
  return <div>Track Detail Page {id}</div>;
}
