import type { ErrorResponse } from "@api/types";
import axios from "axios";

import {
  ApplicationError,
  AuthenticationError,
  ClientError,
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
