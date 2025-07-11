import re

from httpx import AsyncClient
from pytest import LogCaptureFixture

from jamflow.main import app
from tests.utils import assert_log_records_for


async def test_request_id_in_response_headers(
    client: AsyncClient,
) -> None:
    @app.get("/test-request-id")
    async def test_request_id():
        return {"message": "Request ID should be in response headers"}

    response = await client.get("/test-request-id")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert isinstance(response.headers["X-Request-ID"], str)
    assert len(response.headers["X-Request-ID"]) == 36  # UUID length


async def test_request_details_logged(
    client: AsyncClient,
    caplog: LogCaptureFixture,
) -> None:
    @app.get("/test-logging")
    async def test_logging():
        return {"message": "Request details should be logged"}

    with caplog.at_level("INFO"):
        response = await client.get("/test-logging")

    assert response.status_code == 200

    uuid_pattern = re.compile(r"[0-9a-fA-F-]{36}")

    assert_log_records_for(
        caplog,
        level="INFO",
        expected_contexts=[
            {
                "event": "Request received",
                "method": "GET",
                "path": "/test-logging",
                "request_id": uuid_pattern,
            },
            {
                "event": "Request processed",
                "method": "GET",
                "path": "/test-logging",
                "request_id": uuid_pattern,
            },
        ],
        logger_name="jamflow.core.middlewares",
    )
