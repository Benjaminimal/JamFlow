import { useRouteError } from "react-router-dom";

import { H2 } from "@/components/primitives";
import { getErrorMessage } from "@/lib/errorUtils";
import { getLogger } from "@/lib/logging";

const logger = getLogger("ErrorPage");

export function ErrorPage() {
  const error = useRouteError();
  logger.error(error);

  const errorMessage = getErrorMessage(error || "Page not found");

  return (
    <div id="error-page" className="space-y-2 p-4">
      <H2>Oops!</H2>
      <p className="text-muted-foreground text-sm">
        Sorry, an unexpected error has occurred.
      </p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  );
}
