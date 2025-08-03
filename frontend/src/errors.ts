export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NetworkError extends ApplicationError {}
export class ValidationError extends ApplicationError {}
export class NotFoundError extends ApplicationError {}
export class ClientError extends ApplicationError {}
