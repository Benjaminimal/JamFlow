import datetime
from collections.abc import Callable
from typing import Annotated
from unittest import mock

import pytest
from fastapi import FastAPI, HTTPException, Query
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel
from pytest import LogCaptureFixture

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
from tests.utils import assert_log_records_for


@pytest.fixture
async def non_raising_client(app: FastAPI) -> AsyncClient:
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
def temp_route(app: FastAPI):
    """
    Fixture to create temporary routes for testing.
    """
    registered_paths = []

    def decorator(path: str, method: str = "GET", **kwargs):
        def wrapper(func: Callable):
            app.router.add_api_route(path, func, methods=[method], **kwargs)
            registered_paths.append(path)
            return func

        return wrapper

    yield decorator

    app.router.routes = [
        route
        for route in app.router.routes
        if getattr(route, "path", None) not in registered_paths
    ]


class MockLibraryError(Exception):
    """
    Mock error to simulate an unhandled external library exception
    bubbling up to the api layer.
    """


def assert_log_records(
    caplog: LogCaptureFixture,
    level: str,
    expected_contexts: list[str],
) -> None:
    return assert_log_records_for(
        caplog,
        level,
        expected_contexts,
        logger_name="jamflow.api.exception_handlers",
    )


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
    caplog: LogCaptureFixture,
    exception: Exception,
    expected_status: int,
    expected_response: dict,
):
    path = "/error"

    @temp_route(path)
    def handler():
        raise exception

    with caplog.at_level("INFO"):
        response = await non_raising_client.get(path)

    assert response.status_code == expected_status
    assert response.json() == expected_response

    assert_log_records(caplog, "INFO", [{"event": "Application exception handled"}])


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
    caplog: LogCaptureFixture,
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

    assert_log_records(caplog, "ERROR", [{"event": "Unhandled application exception"}])


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
    caplog: LogCaptureFixture,
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

    assert_log_records(caplog, "ERROR", [{"event": "Unhandled external exception"}])


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
        statucs_code = get_http_status(exec_type)
        try:
            get_error_code(statucs_code)
        except KeyError:
            pytest.fail(f"{exec_type} not mapped to an HTTP status code")


async def test_timestamp_in_error_response(
    non_raising_client: AsyncClient,
    temp_route,
    mocker,
):
    fixed_dt = datetime.datetime(2020, 3, 2, 11, 32, 11)
    mocker.patch(
        "jamflow.schemas.error.timezone_now",
        return_value=fixed_dt,
    )

    path = "/error"

    @temp_route(path)
    async def error_route():
        raise ApplicationError("This is a test error")

    response = await non_raising_client.get(path)

    response_data = response.json()
    assert "timestamp" in response_data
    assert isinstance(response_data["timestamp"], str)
    assert response_data["timestamp"] == "2020-03-02T11:32:11"


async def test_request_body_validation_error(
    non_raising_client: AsyncClient,
    temp_route,
    caplog: LogCaptureFixture,
):
    path = "/error"

    class BodySchema(BaseModel):
        name: str
        age: int

    @temp_route(path, method="POST")
    async def error_route(body: BodySchema):
        return {"name": body.name, "age": body.age}

    with caplog.at_level("INFO"):
        response = await non_raising_client.post(path, json={"name": 123})

    assert response.status_code == 400
    response_data = response.json()
    assert response_data.keys() == {"code", "details", "timestamp"}
    assert response_data["code"] == "VALIDATION_ERROR"
    assert isinstance(response_data["timestamp"], str)
    assert isinstance(response_data["details"], list)
    assert len(response_data["details"]) == 2
    assert response_data["details"][0] == {
        "message": "Input should be a valid string",
        "field": "name",
    }
    assert response_data["details"][1] == {
        "message": "Field required",
        "field": "age",
    }

    assert_log_records(
        caplog, "INFO", [{"event": "FastAPI validation exception handled"}]
    )


async def test_path_param_validation_error(
    non_raising_client: AsyncClient,
    temp_route,
    caplog: LogCaptureFixture,
):
    @temp_route("/error/{item_id}")
    async def error_route(item_id: int):
        return {"item_id": item_id}

    with caplog.at_level("INFO"):
        response = await non_raising_client.get("/error/foo")

    assert response.status_code == 400
    response_data = response.json()
    assert response_data.keys() == {"code", "details", "timestamp"}
    assert response_data["code"] == "VALIDATION_ERROR"
    assert isinstance(response_data["timestamp"], str)
    assert isinstance(response_data["details"], list)
    assert len(response_data["details"]) == 1
    assert response_data["details"][0] == {
        "message": "Input should be a valid integer, unable to parse string as an integer",
        "field": "item_id",
    }

    assert_log_records(
        caplog, "INFO", [{"event": "FastAPI validation exception handled"}]
    )


async def test_query_param_validation_error(
    non_raising_client: AsyncClient,
    temp_route,
    caplog: LogCaptureFixture,
):
    path = "/error"

    class QueryParamSchema(BaseModel):
        name: str
        age: int

    @temp_route(path)
    async def error_route(query_params: Annotated[QueryParamSchema, Query()]):
        return {"name": query_params.name, "age": query_params.age}

    with caplog.at_level("INFO"):
        response = await non_raising_client.get(path, params={"age": "foo"})

    assert response.status_code == 400
    response_data = response.json()
    assert response_data.keys() == {"code", "details", "timestamp"}
    assert response_data["code"] == "VALIDATION_ERROR"
    assert isinstance(response_data["timestamp"], str)
    assert isinstance(response_data["details"], list)
    assert len(response_data["details"]) == 2
    assert response_data["details"][0] == {
        "message": "Field required",
        "field": "name",
    }
    assert response_data["details"][1] == {
        "message": "Input should be a valid integer, unable to parse string as an integer",
        "field": "age",
    }

    assert_log_records(
        caplog, "INFO", [{"event": "FastAPI validation exception handled"}]
    )


async def test_response_validation_error(
    non_raising_client: AsyncClient,
    temp_route,
    caplog: LogCaptureFixture,
):
    class ResponseSchema(BaseModel):
        name: str
        age: int

    path = "/error"

    @temp_route(path, response_model=ResponseSchema)
    async def error_route():
        return {"age": "not-an-integer"}

    with caplog.at_level("ERROR"):
        response = await non_raising_client.get(path)

    assert response.status_code == 500
    response_data = response.json()
    assert response_data.keys() == {"code", "details", "timestamp"}
    assert response_data["code"] == "INTERNAL_ERROR"
    assert isinstance(response_data["timestamp"], str)
    assert isinstance(response_data["details"], list)
    assert len(response_data["details"]) == 1
    assert response_data["details"][0] == {
        "message": "Internal server error",
    }

    assert_log_records(caplog, "ERROR", [{"event": "Unhandled external exception"}])


async def test_fast_api_http_exception_handler(
    non_raising_client: AsyncClient,
    temp_route,
    caplog: LogCaptureFixture,
):
    path = "/error"

    @temp_route(path)
    def error_route():
        raise HTTPException(status_code=422, detail="Balance exceeded")

    with caplog.at_level("INFO"):
        response = await non_raising_client.get(path)

    assert response.status_code == 422
    assert response.json() == {
        "code": "BUSINESS_RULE_VIOLATION",
        "timestamp": mock.ANY,
        "details": [{"message": "Balance exceeded"}],
    }

    assert_log_records(caplog, "INFO", [{"event": "FastAPI HTTP exception handled"}])


async def test_fast_api_404_for_unknown_path(
    non_raising_client: AsyncClient,
    caplog: LogCaptureFixture,
):
    with caplog.at_level("INFO"):
        response = await non_raising_client.get("/non-existent")

    assert response.status_code == 404
    assert response.json() == {
        "code": "NOT_FOUND",
        "timestamp": mock.ANY,
        "details": [{"message": "Endpoint not found"}],
    }

    assert_log_records(caplog, "INFO", [{"event": "Page not found"}])
