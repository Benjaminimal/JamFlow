from datetime import UTC, datetime, timezone


def timezone_now(tz: timezone = UTC) -> datetime:
    """Return the current datetime in the given timezone."""
    return datetime.now(tz)
