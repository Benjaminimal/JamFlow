from datetime import UTC, datetime, timezone


def timezone_now(tz: timezone = UTC):
    """Return the current datetime in the given timezone."""
    return datetime.now(tz)
