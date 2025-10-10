import { type TrackDetailParams } from "@/pages/TrackDetail";

type UrlGenOptions = {
  absolute?: boolean;
};

const root = (options?: UrlGenOptions): string => generateUrl("/", options);

const trackList = (options?: UrlGenOptions): string =>
  generateUrl("/tracks", options);

const trackDetail = (
  params: TrackDetailParams,
  options?: UrlGenOptions,
): string => {
  const basePath = `/tracks/${params.id}`;
  return generateUrl(basePath, options);
};

function generateUrl(path: string, options?: UrlGenOptions): string {
  if (options?.absolute) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export const urlGenerator = {
  root,
  trackList,
  trackDetail,
} as const;
