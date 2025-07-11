from pytest import LogCaptureFixture


def assert_log_records_for(
    caplog: LogCaptureFixture,
    level: str,
    expected_contexts: list[str],
    logger_name: str | None = None,
) -> None:
    """
    Utility function to assert that specific log events were captured.
    Passing `logger_name` filters logs by the specified logger.
    """
    if logger_name is not None:
        handler_logs = [
            record for record in caplog.records if record.name == logger_name
        ]
    else:
        handler_logs = caplog.records

    assert len(handler_logs) == len(expected_contexts)
    for i, expected_context in enumerate(expected_contexts):
        assert handler_logs[i].levelname == level
        # TODO: refine logging setup such that we can assert on the log context
        assert expected_context in handler_logs[i].message
