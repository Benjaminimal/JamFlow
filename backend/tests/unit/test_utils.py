import pytest

from jamflow.utils import replace_base_url


@pytest.mark.parametrize(
    "url, new_base, expected_url",
    [
        (
            "http://internal/",
            "https://external/",
            "https://external/",
        ),
        (
            "http://internal:9000/",
            "https://external/",
            "https://external/",
        ),
        (
            "http://internal/",
            "https://external:8080/",
            "https://external:8080/",
        ),
        (
            "http://internal:9000/",
            "https://external:8080/",
            "https://external:8080/",
        ),
        (
            "http://internal/bucket/key?AWSAccessKeyId=abc&Signature=xyz",
            "https://external/",
            "https://external/bucket/key?AWSAccessKeyId=abc&Signature=xyz",
        ),
        (
            "https://internal/bucket/key?X-Amz-Algorithm=AWS4-HMAC-SHA256",
            "https://external/",
            "https://external/bucket/key?X-Amz-Algorithm=AWS4-HMAC-SHA256",
        ),
        (
            "http://internal/bucket/key",
            "https://external/",
            "https://external/bucket/key",
        ),
        (
            "https://internal/bucket/key",
            "https://external/",
            "https://external/bucket/key",
        ),
        (
            "https://external/bucket/key?AWSAccessKeyId=abc",
            "https://external/",
            "https://external/bucket/key?AWSAccessKeyId=abc",
        ),
    ],
)
def test_replace_site(url, new_base, expected_url):
    assert replace_base_url(url, new_base) == expected_url


@pytest.mark.parametrize(
    "url, new_base",
    [
        ("", "https://external/"),
        ("http://internal/", ""),
        ("http://internal/", "not_a_url"),
        ("not_a_url", "https://external/"),
    ],
)
def test_replace_site_invalid_urls(url, new_base):
    with pytest.raises(ValueError):
        replace_base_url(url, new_base)
