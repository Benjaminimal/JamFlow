import { createBrowserRouter } from "react-router-dom";

import { ErrorPage } from "@/pages/Error";
import { Root } from "@/pages/Root";
import { TrackList } from "@/pages/TrackList";

export const routes = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <TrackList />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
