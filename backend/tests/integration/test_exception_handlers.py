import pytest
from httpx import AsyncClient

from jamflow.core.exceptions import ApplicationException
from jamflow.main import app
from jamflow.services.exceptions import (
    ConflictException,
    ResourceNotFoundException,
    ValidationException,
)


@pytest.mark.parametrize(
    "path,exception,expected_status,expected_response",
    [
        (
            "/application-error",
            ApplicationException("Application error occurred"),
            500,
            {"detail": {"msg": "Application error occurred"}},
        ),
        (
            "/validation-error",
            ValidationException("Validation failed", field="username"),
            422,
            {"detail": {"msg": "Validation failed", "field": "username"}},
        ),
        (
            "/not-found-error",
            ResourceNotFoundException("Something"),
            404,
            {"detail": {"msg": "Something not found"}},
        ),
        (
            "/conflict-error",
            ConflictException("Conflict occurred"),
            409,
            {"detail": {"msg": "Conflict occurred"}},
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
