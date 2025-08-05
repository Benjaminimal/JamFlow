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
    case 422:
      // TODO: add field level information from the server response
      return new ValidationError("Validation failed", options);
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
