import { Navigate } from "react-router-dom";

import { ErrorPage } from "@/pages/Error";
import { Root } from "@/pages/Root";
import { TrackDetail } from "@/pages/TrackDetail";
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
            element: <Navigate to="/tracks" replace />,
          },
          {
            path: "tracks",
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
