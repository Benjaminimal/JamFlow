import { useRouteError } from "react-router-dom";

import { getErrorMessage } from "@/lib/errorUtils";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  const errorMessage = getErrorMessage(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  );
}
