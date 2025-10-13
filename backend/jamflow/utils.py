from datetime import UTC, datetime, timezone
from urllib.parse import urlparse, urlunparse


def timezone_now(tz: timezone = UTC) -> datetime:
    """Return the current datetime in the given timezone."""
    return datetime.now(tz)


def replace_base_url(url: str, new_base: str) -> str:
    """
    Replace the protocol, host and port of the given URL with those from new_site.

    :raises ValueError: if the original URL or new_base is invalid

    :example:
    >>> replace_base_url("http://internal:9000/bucket/key?AWSAccessKeyId=abc&Signature=xyz", "https://external/")
    >>> 'https://external/bucket/key?AWSAccessKeyId=abc&Signature=xyz'
    """
    parsed_url = urlparse(url)
    new_parsed_url = urlparse(new_base)

    if not parsed_url.scheme or not parsed_url.netloc:
        raise ValueError("Invalid original URL")
    if not new_parsed_url.scheme or not new_parsed_url.netloc:
        raise ValueError("Invalid new_base URL")

    new_parsed_url = parsed_url._replace(
        scheme=new_parsed_url.scheme, netloc=new_parsed_url.netloc
    )
    return urlunparse(new_parsed_url)
