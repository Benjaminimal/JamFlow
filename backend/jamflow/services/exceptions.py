from jamflow.core.exceptions import ApplicationException


class ServiceException(ApplicationException):
    """Base class for service layer exceptions."""


class ValidationException(ServiceException):
    """Raised when validation fails."""

    def __init__(self, message: str, field: str | None) -> None:
        super().__init__(message)
        self.field = field


class ResourceNotFoundException(ServiceException):
    """Raised when a referenced resource is not found."""

    def __init__(self, ressource_name: str) -> None:
        message = f"{ressource_name} not found"
        super().__init__(message)
        self.resource_name = ressource_name


class ConflictException(ServiceException):
    """Raised when there is a conflict, such as duplicate entries."""


class InfrastructureException(ServiceException):
    """Raised when there is an infrastructure failure."""


class StorageException(ServiceException):
    """Exception class for storage errors."""
