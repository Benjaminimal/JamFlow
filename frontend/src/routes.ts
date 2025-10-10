import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { ErrorPage } from "@/pages/Error";
import { Root } from "@/pages/Root";
import { TrackDetail } from "@/pages/TrackDetail";
import { TrackList } from "@/pages/TrackList";
import type { Track } from "@/types";

const rootRoute = createRootRoute({
  component: Root,
  // NOTE: This will not render in the outlet but replace the entire component
  // so the header and footer will be gone
  errorComponent: ErrorPage,
});

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    throw redirect({ to: "/tracks" });
  },
});

export type TrackListSearch = {
  sharedTrackId?: Track["id"];
};

export const trackListRoute = createRoute<void, TrackListSearch>({
  getParentRoute: () => rootRoute,
  path: "/tracks",
  component: TrackList,
  validateSearch: (search: Record<string, string>): TrackListSearch => {
    return {
      sharedTrackId: search.sharedTrackId as Track["id"] | undefined,
    };
  },
});

export const trackDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tracks/$id",
  component: TrackDetail,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute,
    trackListRoute,
    trackDetailRoute,
  ]),
});
