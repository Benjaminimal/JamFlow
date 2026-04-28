from typing import Any, Callable

import pytest
from pytest_structlog import StructuredLogCapture

LogEvent = tuple[str, dict[str, Any]]
AssertLogRecords = Callable[[list[LogEvent]], None]


@pytest.fixture
def assert_log_records(
    log: StructuredLogCapture,
) -> AssertLogRecords:
    """
    Utility function to assert that specific log events were captured.
    """

    def _assert_log_records(expected_events: list[LogEvent]) -> None:
        for message, context in expected_events:
            assert log.has(message, **context), (
                f"Expected log message '{message}' with context {context} not found in logs: {log.events}"
            )

    return _assert_log_records
