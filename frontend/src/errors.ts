export class ApplicationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class NetworkError extends ApplicationError {}
export class ValidationError extends ApplicationError {}
export class AuthenticationError extends ApplicationError {}
export class PermissionError extends ApplicationError {}
export class NotFoundError extends ApplicationError {}
export class ExternalServiceError extends ApplicationError {}
export class ClientError extends ApplicationError {}
export class ConflictError extends ApplicationError {}
