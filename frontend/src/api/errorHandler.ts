import axios from "axios";

import type { ErrorResponse } from "@/api/types";
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
  type ValidationErrorDetails,
} from "@/errors";

export function mapAxiosError(error: unknown): ApplicationError {
  const options = { cause: error };
  if (!axios.isAxiosError(error)) {
    return new ApplicationError("Received non axios error", options);
  }

  if (!error.response) {
    switch (error.code) {
      case "ECONNABORTED":
      case "ETIMEDOUT":
        return new NetworkError("Request timed out", options);
      case "ERR_NETWORK":
        return new NetworkError("Network connection failed", options);
      default:
        return new NetworkError("Unable to connect to server", options);
    }
  }

  const statusCode = error.response.status;

  switch (statusCode) {
    case 400:
    case 422: {
      const validationErrorsDetails = mapValidationErrorDetails(
        error.response.data,
      );
      return new ValidationError(
        "Validation failed",
        validationErrorsDetails,
        options,
      );
    }
    case 401:
      return new AuthenticationError("Authentication required", options);
    case 403:
      return new PermissionError("Access forbidden", options);
    case 404:
      return new NotFoundError("Resource not found", options);
    case 405:
      return new ClientError("Method not allowed", options);
    case 409:
      return new ConflictError("Resource conflict", options);
    default:
      if (statusCode >= 400 && statusCode < 500) {
        return new ClientError("Unexpected client error", options);
      }
      if (statusCode >= 500) {
        return new ExternalServiceError("Unexpected server error", options);
      }
  }

  return new ApplicationError("Unable to map error from request", options);
}

export function getUserFriendlyErrorMessage(error: unknown): string {
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

const apiToInternalFieldMap: Record<string, string> = {
  title: "title",
  recorded_date: "recordedDate",
  upload_file: "file",
};

function mapValidationErrorDetails(
  errorResponse: ErrorResponse,
): ValidationErrorDetails {
  const details: ValidationErrorDetails = {};
  for (const { message, field } of errorResponse.details) {
    if (!field) {
      if (!details.nonField) {
        details.nonField = [];
      }
      details.nonField.push(message);
      continue;
    }

    const key =
      field in apiToInternalFieldMap ? apiToInternalFieldMap[field] : field;
    if (!(key in details)) {
      details[key] = [];
    }
    details[key]!.push(message);
  }
  return details;
}
