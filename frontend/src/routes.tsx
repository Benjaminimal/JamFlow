import { createBrowserRouter } from "react-router-dom";

import { ErrorPage } from "@/pages/Error";
import { Root } from "@/pages/Root";
import { TrackDetail, type TrackDetailParams } from "@/pages/TrackDetail";
import { TrackList } from "@/pages/TrackList";

export const routes = [
  {
    path: "/",
    element: <Root />,
    errorElement: <Root />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            path: "*",
            element: <ErrorPage />,
          },
          {
            index: true,
            element: <TrackList />,
          },
          {
            path: "tracks/:id",
            element: <TrackDetail />,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

export const pathGenerator = {
  root: () => `/`,
  trackList: () => `/`,
  trackDetail: (params: TrackDetailParams) => `/tracks/${params.id}`,
} as const;
