import json
import re
from typing import Any

import pytest
from pytest import LogCaptureFixture


def assert_log_records_for(
    caplog: LogCaptureFixture,
    level: str,
    expected_contexts: list[dict[str, Any]],
    logger_name: str | None = None,
) -> None:
    """
    Utility function to assert that specific log events were captured.
    Passing `logger_name` filters logs by the specified logger.

    You can pass a compiled regex pattern as a value in `expected_contexts`
    to match against the log data.
    """
    logs = [
        record
        for record in caplog.records
        if logger_name is None or record.name == logger_name
    ]

    assert len(logs) == len(expected_contexts), (
        f"Expected {len(expected_contexts)} log records, got {len(logs)}"
    )

    for record, expected in zip(logs, expected_contexts, strict=True):
        assert record.levelname == level, (
            f"Log: Expected level '{level}', got '{record.levelname}'"
        )

        try:
            log_data = json.loads(record.getMessage())
        except (TypeError, json.JSONDecodeError) as exc:
            pytest.fail(f"Failed to decode JSON message: {record.getMessage()} ({exc})")

        for key, value in expected.items():
            assert key in log_data, f"Missing key '{key}'"
            if isinstance(value, re.Pattern):
                assert re.match(value, log_data[key]), (
                    f"Value for '{key}' does not match pattern '{value.pattern}'"
                )
            else:
                assert log_data[key] == value, (
                    f"Value for '{key}' expected '{value}', got '{log_data[key]}'"
                )
