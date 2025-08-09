export class ApplicationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export type ValidationErrorDetails = {
  nonField?: string[];
  [field: string]: string[] | undefined;
};

export class ValidationError extends ApplicationError {
  details: ValidationErrorDetails;

  constructor(
    message: string,
    details: ValidationErrorDetails,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.details = details;
  }
}

export class NetworkError extends ApplicationError {}
export class AuthenticationError extends ApplicationError {}
export class PermissionError extends ApplicationError {}
export class NotFoundError extends ApplicationError {}
export class ExternalServiceError extends ApplicationError {}
export class ClientError extends ApplicationError {}
export class ConflictError extends ApplicationError {}
