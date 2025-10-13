import {
  ApplicationError,
  AuthenticationError,
  ClientError,
  ConfigurationError,
  ConflictError,
  ExternalServiceError,
  NetworkError,
  NotFoundError,
  PermissionError,
  ValidationError,
} from "@/errors";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApplicationError) {
    return getApplicationErrorMessage(error);
  }
  return getFallbackErrorMessage(error);
}

function getApplicationErrorMessage(error: ApplicationError): string {
  if (error instanceof ValidationError) {
    return "Please correct the errors in the form.";
  } else if (error instanceof ConfigurationError) {
    return "Something isn't set up correctly.";
  } else if (error instanceof NetworkError) {
    return "We're having trouble connecting. Please check your internet.";
  } else if (error instanceof AuthenticationError) {
    return "Please log in to continue.";
  } else if (error instanceof PermissionError) {
    return "You don't have permission to do that.";
  } else if (error instanceof NotFoundError) {
    return "Sorry, we couldn't find what you were looking for.";
  } else if (error instanceof ConflictError) {
    return "This item already exists or conflicts with existing data.";
  } else if (
    error instanceof ClientError ||
    error instanceof ExternalServiceError
  ) {
    return "Something went wrong on our end. Please try again later.";
  } else {
    return "Sorry, something went wrong.";
  }
}

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
function getFallbackErrorMessage(error: unknown): string {
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
