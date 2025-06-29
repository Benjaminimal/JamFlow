import pytest
from httpx import AsyncClient

from jamflow.core.exceptions import (
    ApplicationError,
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    ConfigurationError,
    DatabaseError,
    DataIntegrityError,
    ExternalServiceError,
    RateLimitError,
    ResourceNotFoundError,
    StorageError,
    ValidationError,
)
from jamflow.main import app


class MockLibraryError(Exception):
    """
    Mock error to simulate an unhandled external library exception
    bubbling up to the api layer.
    """


@pytest.mark.parametrize(
    "path,exception,expected_status,expected_response",
    [
        (
            "/application-error",
            ApplicationError("Application error occurred"),
            500,
            {"detail": {"msg": "Application error occurred"}},
        ),
        (
            "/validation-error",
            ValidationError("Validation failed", field="username"),
            400,
            {"detail": {"msg": "Validation failed", "field": "username"}},
        ),
        (
            "/authentication-error",
            AuthenticationError("Authentication failed"),
            401,
            {"detail": {"msg": "Authentication failed"}},
        ),
        (
            "/authorization-error",
            AuthorizationError("Permission denied"),
            403,
            {"detail": {"msg": "Permission denied"}},
        ),
        (
            "/not-found-error",
            ResourceNotFoundError("Something not found"),
            404,
            {"detail": {"msg": "Something not found"}},
        ),
        (
            "/business-logic-error",
            BusinessLogicError("Business logic error occurred"),
            422,
            {"detail": {"msg": "Business logic error occurred"}},
        ),
        (
            "/conflict-error",
            DataIntegrityError("Conflict occurred"),
            409,
            {"detail": {"msg": "Conflict occurred"}},
        ),
        (
            "/rate-limit-error",
            RateLimitError("Rate limit exceeded"),
            429,
            {"detail": {"msg": "Rate limit exceeded"}},
        ),
        (
            "/storage-error",
            StorageError("Storage operation failed"),
            500,
            {"detail": {"msg": "Storage operation failed"}},
        ),
        (
            "/database-error",
            DatabaseError("Database operation failed"),
            500,
            {"detail": {"msg": "Database operation failed"}},
        ),
        (
            "/external-service-error",
            ExternalServiceError("External service error occurred"),
            500,
            {"detail": {"msg": "External service error occurred"}},
        ),
        (
            "/configuration-error",
            ConfigurationError("Configuration error occurred"),
            500,
            {"detail": {"msg": "Configuration error occurred"}},
        ),
        (
            "/mock-library-error",
            MockLibraryError("Mock library error occurred"),
            500,
            {"detail": {"msg": "Internal server error"}},
        ),
        (
            "/type-error",
            TypeError("Type error occurred"),
            500,
            {"detail": {"msg": "Internal server error"}},
        ),
        (
            "/value-error",
            ValueError("Value error occurred"),
            500,
            {"detail": {"msg": "Internal server error"}},
        ),
        (
            "/key-error",
            KeyError("Key error occurred"),
            500,
            {"detail": {"msg": "Internal server error"}},
        ),
        (
            "/generic-exception",
            Exception("An unexpected error occurred"),
            500,
            {"detail": {"msg": "Internal server error"}},
        ),
    ],
)
async def test_exception_handlers(
    simple_client: AsyncClient,
    path: str,
    exception: Exception,
    expected_status: int,
    expected_response: dict,
):
    @app.get(path)
    async def error_route():
        raise exception

    response = await simple_client.get(path)

    assert response.status_code == expected_status
    assert response.json() == expected_response
