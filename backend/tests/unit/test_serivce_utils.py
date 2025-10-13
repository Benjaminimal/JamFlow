import uuid
from datetime import datetime

import pytest
from pytest_mock import MockerFixture

from jamflow.services.utils import generate_clip_path, generate_track_path


def test_generate_track_path_returns_path_nested_by_year_and_month(
    mocker: MockerFixture,
):
    mock_timezone_now = mocker.patch("jamflow.services.utils.timezone_now")
    mock_timezone_now.return_value = datetime(2023, 1, 1, 1, 1, 1)

    hex_digest = "1234567890abcdef1234567890abcdef"
    unique_id = uuid.UUID(hex=hex_digest)
    extension = "txt"

    path = generate_track_path(unique_id, extension)

    assert (
        path
        == "tracks/2023/01/1234567890abcdef1234567890abcdef/1234567890abcdef1234567890abcdef.txt"
    )


def test_generate_track_path_raises_value_error_on_empty_extension():
    with pytest.raises(ValueError):
        generate_track_path(uuid.uuid4(), "")


def test_generate_clip_path_returns_path_nested_under_track_directory():
    track_path = "tracks/2023/01/1234567890abcdef1234567890abcdef/1234567890abcdef1234567890abcdef.txt"
    clip_id = uuid.UUID(hex="fedcba0987654321fedcba0987654321")

    extension = "txt"

    path = generate_clip_path(track_path, clip_id, extension)

    assert (
        path
        == "tracks/2023/01/1234567890abcdef1234567890abcdef/clips/fedcba0987654321fedcba0987654321.txt"
    )


def test_generate_clip_path_raises_value_error_when_track_path_has_no_directory():
    invalid_path = "file_without_directory.txt"
    clip_hex_digest = "fedcba0987654321fedcba0987654321"
    clip_id = uuid.UUID(hex=clip_hex_digest)

    extension = "txt"

    with pytest.raises(ValueError, match="Track path must contain directories"):
        generate_clip_path(invalid_path, clip_id, extension)


def test_generate_clip_path_raises_value_error_on_empty_extension():
    track_path = "tracks/2023/01/1234567890abcdef1234567890abcdef/1234567890abcdef1234567890abcdef.txt"
    clip_hex_digest = "fedcba0987654321fedcba0987654321"
    clip_id = uuid.UUID(hex=clip_hex_digest)

    with pytest.raises(ValueError, match="Extension must not be empty"):
        generate_clip_path(track_path, clip_id, "")
