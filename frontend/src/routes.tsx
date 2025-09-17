import { createBrowserRouter } from "react-router-dom";

import { ErrorPage } from "@/pages/Error";
import Root from "@/pages/Root";
import TrackList from "@/pages/TrackList";
import Upload from "@/pages/Upload";

export const routes = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/upload",
        element: <Upload />,
      },
      {
        path: "/tracks",
        element: <TrackList />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
