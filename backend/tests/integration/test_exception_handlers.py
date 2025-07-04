import datetime
from collections.abc import Callable
from typing import Annotated
from unittest import mock

import pytest
from fastapi import Query
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

from jamflow.api.exception_handlers import (
    get_error_code,
    get_http_status,
)
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


@pytest.fixture
async def non_raising_client():
    """
    Fixture to create an ASGI test client that does not raise exceptions.
    This is useful for testing exception handling without having unhandled
    exceptions bubble up.
    """
    async with AsyncClient(
        transport=ASGITransport(app, raise_app_exceptions=False),
        base_url="http://test",
    ) as c:
        yield c


@pytest.fixture
def temp_route():
    """
    Fixture to create temporary routes for testing.
    """
    registered_paths = []

    def decorator(path: str, method: str = "GET"):
        def wrapper(func: Callable):
            app.router.add_api_route(path, func, methods=[method])
            registered_paths.append(path)
            return func

        return wrapper

    yield decorator

    app.router.routes = [
        r for r in app.router.routes if getattr(r, "path", None) not in registered_paths
    ]


class MockLibraryError(Exception):
    """
    Mock error to simulate an unhandled external library exception
    bubbling up to the api layer.
    """


@pytest.mark.parametrize(
    "exception,expected_status,expected_response",
    [
        (
            ValidationError("Validation failed"),
            400,
            {
                "code": "VALIDATION_ERROR",
                "timestamp": mock.ANY,
                "details": [{"message": "Validation failed"}],
            },
        ),
        (
            AuthenticationError("Authentication failed"),
            401,
            {
                "code": "UNAUTHORIZED",
                "timestamp": mock.ANY,
                "details": [{"message": "Authentication failed"}],
            },
        ),
        (
            AuthorizationError("Permission denied"),
            403,
            {
                "code": "FORBIDDEN",
                "timestamp": mock.ANY,
                "details": [{"message": "Permission denied"}],
            },
        ),
        (
            ResourceNotFoundError("Something not found"),
            404,
            {
                "code": "NOT_FOUND",
                "timestamp": mock.ANY,
                "details": [{"message": "Something not found"}],
            },
        ),
        (
            BusinessLogicError("Business logic error occurred"),
            422,
            {
                "code": "BUSINESS_RULE_VIOLATION",
                "timestamp": mock.ANY,
                "details": [{"message": "Business logic error occurred"}],
            },
        ),
        (
            DataIntegrityError("Conflict occurred"),
            409,
            {
                "code": "CONFLICT",
                "timestamp": mock.ANY,
                "details": [{"message": "Conflict occurred"}],
            },
        ),
        (
            RateLimitError("Rate limit exceeded"),
            429,
            {
                "code": "RATE_LIMITED",
                "timestamp": mock.ANY,
                "details": [{"message": "Rate limit exceeded"}],
            },
        ),
    ],
)
async def test_application_exception_handler_4xx(
    non_raising_client: AsyncClient,
    temp_route,
    caplog,
    exception: Exception,
    expected_status: int,
    expected_response: dict,
):
    path = "/error"

    @temp_route(path)
    def handler():
        raise exception

    with caplog.at_level("ERROR"):
        response = await non_raising_client.get(path)

    assert response.status_code == expected_status
    assert response.json() == expected_response
    assert len(caplog.records) == 0


@pytest.mark.parametrize(
    "exception,expected_response",
    [
        (
            StorageError("Storage operation failed"),
            {
                "code": "INTERNAL_ERROR",
                "timestamp": mock.ANY,
                "details": [{"message": "Storage operation failed"}],
            },
        ),
        (
            DatabaseError("Database operation failed"),
            {
                "code": "INTERNAL_ERROR",
                "timestamp": mock.ANY,
                "details": [{"message": "Database operation failed"}],
            },
        ),
        (
            ExternalServiceError("External service error occurred"),
            {
                "code": "INTERNAL_ERROR",
                "timestamp": mock.ANY,
                "details": [{"message": "External service error occurred"}],
            },
        ),
        (
            ConfigurationError("Configuration error occurred"),
            {
                "code": "INTERNAL_ERROR",
                "timestamp": mock.ANY,
                "details": [{"message": "Configuration error occurred"}],
            },
        ),
    ],
)
async def test_application_exception_handler_500(
    non_raising_client: AsyncClient,
    temp_route,
    caplog,
    exception: Exception,
    expected_response: dict,
):
    path = "/error"

    @temp_route(path)
    async def error_route():
        raise exception

    with caplog.at_level("ERROR"):
        response = await non_raising_client.get(path)

    assert response.status_code == 500
    assert response.json() == expected_response

    assert len(caplog.records) == 1
    # TODO: refine logging setup such that we can assert on the log context
    assert '"event": "Unhandled application exception"' in caplog.records[0].message


@pytest.mark.parametrize(
    "exception",
    [
        MockLibraryError("Mock library error occurred"),
        TypeError("Type error occurred"),
        ValueError("Value error occurred"),
        KeyError("Key error occurred"),
        Exception("An unexpected error occurred"),
        # NOTE: ApplicationError should never be raised directly
        #       and should result in an unexpected error.
        ApplicationError("Application error occurred"),
    ],
)
async def test_external_exception_handler(
    non_raising_client: AsyncClient,
    temp_route,
    caplog,
    exception: Exception,
):
    path = "/error"

    @temp_route(path)
    async def error_route():
        raise exception

    with caplog.at_level("ERROR"):
        response = await non_raising_client.get(path)

    assert response.status_code == 500
    assert response.json() == {
        "code": "INTERNAL_ERROR",
        "timestamp": mock.ANY,
        "details": [{"message": "Internal server error"}],
    }

    assert len(caplog.records) == 1
    # TODO: refine logging setup such that we can assert on the log context
    assert '"event": "Unhandled external exception"' in caplog.records[0].message


def test_all_application_error_children_map_to_http_status_codes():
    all_subclasses = ApplicationError.__subclasses__()
    for exec_type in all_subclasses:
        try:
            get_http_status(exec_type)
        except KeyError:
            pytest.fail(f"{exec_type} not mapped to an HTTP status code")


def test_all_application_error_children_map_to_error_codes():
    all_subclasses = ApplicationError.__subclasses__()
    for exec_type in all_subclasses:
        try:
            get_error_code(exec_type)
        except KeyError:
            pytest.fail(f"{exec_type} not mapped to an HTTP status code")


async def test_timestamp_in_error_response(
    non_raising_client: AsyncClient,
    mocker,
):
    fixed_dt = datetime.datetime(2020, 3, 2, 11, 32, 11)
    mocker.patch(
        "jamflow.schemas.error.timezone_now",
        return_value=fixed_dt,
    )

    @app.get("/timestamp-error")
    async def error_route():
        raise ApplicationError("This is a test error")

    response = await non_raising_client.get("/timestamp-error")

    response_data = response.json()
    assert "timestamp" in response_data
    assert isinstance(response_data["timestamp"], str)
    assert response_data["timestamp"] == "2020-03-02T11:32:11"


async def test_request_body_validation_error(
    non_raising_client: AsyncClient,
):
    class BodySchema(BaseModel):
        name: str
        age: int

    @app.post("/body-validation-error")
    async def error_route(body: BodySchema):
        return {"name": body.name, "age": body.age}

    response = await non_raising_client.post(
        "/body-validation-error", json={"name": 123}
    )

    assert response.status_code == 422
    response_data = response.json()
    assert response_data.keys() == {"detail"}
    assert isinstance(response_data["detail"], list)
    assert len(response_data["detail"]) == 2
    assert response_data["detail"][0] == {
        "loc": ["body", "name"],
        "msg": "Input should be a valid string",
        "type": "string_type",
        "input": 123,
    }
    assert response_data["detail"][1] == {
        "loc": ["body", "age"],
        "msg": "Field required",
        "type": "missing",
        "input": {"name": 123},
    }


async def test_path_param_validation_error(
    non_raising_client: AsyncClient,
):
    @app.get("/path-validation-error/{item_id}")
    async def error_route(item_id: int):
        return {"item_id": item_id}

    response = await non_raising_client.get("/path-validation-error/foo")

    assert response.status_code == 422
    response_data = response.json()
    assert response_data.keys() == {"detail"}
    assert isinstance(response_data["detail"], list)
    assert len(response_data["detail"]) == 1
    assert response_data["detail"][0] == {
        "loc": ["path", "item_id"],
        "msg": "Input should be a valid integer, unable to parse string as an integer",
        "type": "int_parsing",
        "input": "foo",
    }


async def test_query_param_validation_error(
    non_raising_client: AsyncClient,
):
    class FilterSchema(BaseModel):
        name: str
        age: int

    @app.get("/param-validation-error")
    async def error_route(filter_query: Annotated[FilterSchema, Query()]):
        return {"name": filter_query.name, "age": filter_query.age}

    response = await non_raising_client.get(
        "/param-validation-error", params={"age": "foo"}
    )

    assert response.status_code == 422
    response_data = response.json()
    assert response_data.keys() == {"detail"}
    assert isinstance(response_data["detail"], list)
    assert len(response_data["detail"]) == 2
    assert response_data["detail"][0] == {
        "loc": ["query", "name"],
        "msg": "Field required",
        "type": "missing",
        "input": {"age": "foo"},
    }
    assert response_data["detail"][1] == {
        "loc": ["query", "age"],
        "msg": "Input should be a valid integer, unable to parse string as an integer",
        "type": "int_parsing",
        "input": "foo",
    }
