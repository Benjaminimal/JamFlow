type ErrorProbe = {
  message?: unknown;
  statusText?: unknown;
};

/**
 * Extracts a meaningful error message from various error formats.
 * It prioritizes `statusText` and `message` properties, trimming whitespace.
 * If no valid message is found, it returns "Unknown error".
 *
 * @param error - The error object or string to extract the message from.
 * @returns A trimmed string representing the error message.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    const trimmedError = error.trim();
    if (trimmedError) return trimmedError;
  }

  if (error && typeof error === "object") {
    const { statusText, message } = error as ErrorProbe;

    if (typeof statusText === "string") {
      const trimmedStatus = statusText.trim();
      if (trimmedStatus) return trimmedStatus;
    }

    if (typeof message === "string") {
      const trimmedMessage = message.trim();
      if (trimmedMessage) return trimmedMessage;
    }
  }

  return "Unknown error";
}
