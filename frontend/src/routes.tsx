import ErrorPage from "@pages/Error";
import Root from "@pages/Root";
import Upload from "@pages/Upload";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/upload",
        element: <Upload />,
      },
    ],
  },
]);

export default router;
