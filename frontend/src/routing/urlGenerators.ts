import { createSearchParams } from "react-router-dom";

import type {
  TrackDetailParams,
  TrackDetailSearch,
  TrackListSearch,
} from "@/routing/types";

type UrlGenOptions = {
  absolute?: boolean;
};

const root = (options?: UrlGenOptions): string => generateUrl("/", options);

const trackList = (
  search?: TrackListSearch,
  options?: UrlGenOptions,
): string => {
  const path = "/tracks";
  const queryString = createSearchParams(search).toString();
  const url = appendQueryString(path, queryString);
  return generateUrl(url, options);
};

const trackDetail = (
  params: TrackDetailParams,
  search?: TrackDetailSearch,
  options?: UrlGenOptions,
): string => {
  const path = `/tracks/${params.id}`;
  const queryString = createSearchParams(search).toString();
  const url = appendQueryString(path, queryString);
  return generateUrl(url, options);
};

function generateUrl(path: string, options?: UrlGenOptions): string {
  if (options?.absolute) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

function appendQueryString(url: string, queryString: string): string {
  if (!queryString) return url;
  return `${url}?${queryString}`;
}

export const urlGenerator = {
  root,
  trackList,
  trackDetail,
} as const;
