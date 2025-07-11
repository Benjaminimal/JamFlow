import re

from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture


async def test_request_id_in_response_headers(
    app: FastAPI,
    client: AsyncClient,
) -> None:
    @app.get("/test-request-id")
    async def test_request_id():
        return {"message": "Request ID should be in response headers"}

    response = await client.get("/test-request-id")

    uuid_pattern = re.compile(r"[0-9a-fA-F-]{36}")

    assert response.status_code == 200
    assert "X-Request-ID" in response.headers, (
        "Response headers does not contain 'X-Request-ID'"
    )
    request_id = response.headers["X-Request-ID"]
    assert isinstance(request_id, str), "Request ID is not a string"
    assert re.match(uuid_pattern, request_id), (
        f"Request ID does not match UUID format: {request_id}"
    )


async def test_request_details_logged(
    app: FastAPI,
    client: AsyncClient,
    mocker: MockerFixture,
    assert_log_records,
) -> None:
    static_uuid = "123e4567-e89b-12d3-a456-426614174000"
    mocker.patch("jamflow.core.middlewares.uuid.uuid4", return_value=static_uuid)

    @app.get("/test-logging")
    async def test_logging():
        return {"message": "Request details should be logged"}

    response = await client.get("/test-logging")

    assert response.status_code == 200

    assert_log_records(
        expected_events=[
            (
                "Request received",
                {
                    "level": "info",
                    "method": "GET",
                    "path": "/test-logging",
                    "request_id": static_uuid,
                },
            ),
            (
                "Request processed",
                {
                    "level": "info",
                    "method": "GET",
                    "path": "/test-logging",
                    "request_id": static_uuid,
                },
            ),
        ],
    )
