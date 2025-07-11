from typing import Any

import pytest
from pytest_structlog import StructuredLogCapture


@pytest.fixture
def assert_log_records(
    log: StructuredLogCapture,
) -> None:
    """
    Utility function to assert that specific log events were captured.
    """
    # assert len(log.events) >= len(expected_events), (
    #     f"Expected at least {len(expected_events)} log records, got {len(log.events)} events in {log.events}"
    # )

    def _assert_log_records(expected_events: list[tuple[str, dict[str, Any]]]):
        for message, context in expected_events:
            assert log.has(message, **context), (
                f"Expected log message '{message}' with context {context} not found in logs: {log.events}"
            )

    return _assert_log_records
