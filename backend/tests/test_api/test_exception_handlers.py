import pytest
from httpx import AsyncClient

from jamflow.core.exceptions import ApplicationException
from jamflow.main import app
from jamflow.services.exceptions.base import (
    ConflictException,
    ResourceNotFoundException,
    ValidationException,
)


@pytest.mark.integration
async def test_application_exception_handler(simple_client: AsyncClient):
    @app.get("/application-error")
    async def application_error():
        raise ApplicationException("Application error occurred")

    response = await simple_client.get("/application-error")
    assert response.status_code == 500
    assert response.json() == {"detail": {"msg": "Application error occurred"}}


@pytest.mark.integration
async def test_validation_exception_handler(simple_client: AsyncClient):
    @app.get("/validation-error")
    async def validation_error():
        raise ValidationException("Validation failed", field="username")

    response = await simple_client.get("/validation-error")
    assert response.status_code == 422
    assert response.json() == {
        "detail": {"msg": "Validation failed", "field": "username"}
    }


@pytest.mark.integration
async def test_resource_not_found_exception_handler(simple_client: AsyncClient):
    @app.get("/not-found-error")
    async def not_found_error():
        raise ResourceNotFoundException("Something")

    response = await simple_client.get("/not-found-error")
    assert response.status_code == 404
    assert response.json() == {"detail": {"msg": "Something not found"}}


@pytest.mark.integration
async def test_conflict_exception_handler(simple_client: AsyncClient):
    @app.get("/conflict-error")
    async def conflict_error():
        raise ConflictException("Conflict occurred")

    response = await simple_client.get("/conflict-error")
    assert response.status_code == 409
    assert response.json() == {"detail": {"msg": "Conflict occurred"}}
