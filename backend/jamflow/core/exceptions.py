class ApplicationError(Exception):
    """Common base class for in application logic exceptions."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ValidationError(ApplicationError):
    """
    Data doesn't meet business rules or format requirements.

    Examples:
        - Invalid email format
        - Required field missing
        - Value out of allowed range
        - Type mismatch
    """

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message)
        self.field = field


class AuthenticationError(ApplicationError):
    """
    User authentication failed.

    Examples:
        - Invalid username/password
        - Expired session token
        - Missing authentication credentials
    """


class AuthorizationError(ApplicationError):
    """
    User is authenticated but lacks permission for an operation.

    Examples:
        - Not a member of the required group
        - User trying to read a resource they don't own
        - Attempt to modify a read-only resource
    """


class ResourceNotFoundError(ApplicationError):
    """
    Required resource doesn't exist.

    Examples:
        - Trying to access a non-existent donation
        - Looking up a user by email but no matching user exists
        - Referencing a soft-deleted resource
    """


class BusinessLogicError(ApplicationError):
    """
    Domain specific rules violated.

    Examples:
        - Trying to set a new status on a donation that is already cancelled
        - Assigning a public_refid to a donation which is out of the allowed range
        - Finishing an unfinished donation that doesn't have a team assigned
    """


class DataIntegrityError(ApplicationError):
    """
    Database constraints violated.

    Examples:
        - Unique constraint violation (e.g. duplicate email)
        - Foreign key constraint violation (e.g. referencing a non-existent user)
        - Check constraint violation (e.g. value out of allowed range)
    """


class RateLimitError(ApplicationError):
    """
    Rate limit exceeded for an external request.

    Examples:
        - Too many API requests in a short time
        - Exceeding allowed number of login attempts
        - Too many requests to a third-party service
    """


class StorageError(ApplicationError):
    """
    Storage operation failed.

    Examples:
        - Unable to connect to storage
        - Failed to read/write/delete object
        - Unexpected response from storage backend
    """


class DatabaseError(ApplicationError):
    """
    Database operation failed.

    Examples:
        - Connection issues
        - Query execution errors
        - Transaction failures
    """


class ExternalServiceError(ApplicationError):
    """
    External dependency failed.

    Examples:
        - Third-party API is down
        - Timeout while waiting for an external service
        - Invalid response from an external service
    """


class ConfigurationError(ApplicationError):
    """
    System misconfiguration preventing operation.

    Examples:
        - Missing required environment variable
        - Invalid type for a configuration setting
        - Conflicting configuration values
    """
