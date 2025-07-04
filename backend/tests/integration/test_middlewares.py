import re

from httpx import AsyncClient

from jamflow.main import app


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
    caplog,
) -> None:
    @app.get("/test-logging")
    async def test_logging():
        return {"message": "Request details should be logged"}

    with caplog.at_level("INFO"):
        response = await client.get("/test-logging")

    assert response.status_code == 200
    middlware_log_records = [
        record for record in caplog.records if record.name == "jamflow.core.middlewares"
    ]
    assert len(middlware_log_records) == 2
    received_log, processed_log = middlware_log_records

    uuid_pattern = re.compile(r'"request_id":\s*"[0-9a-fA-F-]{36}"')

    # TODO: refine logging setup such that we can assert on the log context
    assert '"event": "Request received"' in received_log.message
    assert '"method": "GET"' in received_log.message
    assert '"path": "/test-logging"' in received_log.message
    assert uuid_pattern.search(received_log.message)

    assert '"event": "Request processed"' in processed_log.message
    assert '"method": "GET"' in processed_log.message
    assert '"path": "/test-logging"' in processed_log.message
    assert uuid_pattern.search(processed_log.message)
