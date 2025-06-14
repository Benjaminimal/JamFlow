import pytest

from jamflow.schemas.validators import (
    empty_string_to_none,
    get_file_size_validator,
    validate_audo_file_format,
)


def test_empty_string_to_none_casts_empty_string():
    assert empty_string_to_none("") is None


def test_empty_string_to_none_keeps_none():
    assert empty_string_to_none(None) is None


def test_empty_string_to_none_keeps_none_empty():
    assert empty_string_to_none("test") == "test"


@pytest.mark.parametrize(
    "upload_file",
    [
        "mp3_upload_file",
        "ogg_upload_file",
        "wav_upload_file",
    ],
)
def test_validate_audio_file_format_accepts_supported_formats(
    upload_file: str, request: pytest.FixtureRequest
):
    upload_file = request.getfixturevalue(upload_file)
    assert validate_audo_file_format(upload_file) == upload_file
    assert upload_file.file.tell() == 0


def test_validate_audio_file_format_rejects_unsupported_format(txt_upload_file):
    txt_upload_file.filename = "test.txt"
    with pytest.raises(ValueError, match="Unsupported file format."):
        validate_audo_file_format(txt_upload_file)


@pytest.fixture
def file_size_2mb_max_validator():
    return get_file_size_validator(2 * 1024 * 1024)  # 2 MB max


def test_file_size_validator_accepts_file_within_limit(
    mp3_upload_file,
    file_size_2mb_max_validator,
):
    mp3_upload_file.size = 2 * 1024 * 1024  # 2 MB
    validated_upload_file = file_size_2mb_max_validator(mp3_upload_file)
    assert validated_upload_file == mp3_upload_file
    assert validated_upload_file.file.tell() == 0


def test_file_size_validator_rejects_file_too_large(
    mp3_upload_file,
    file_size_2mb_max_validator,
):
    mp3_upload_file.size = 3 * 1024 * 1024 + 1  # 2 MB + 1 byte
    with pytest.raises(ValueError, match="File is larger than 2 MB"):
        file_size_2mb_max_validator(mp3_upload_file)


def test_file_size_validator_rejects_empty_file(
    mp3_upload_file,
    file_size_2mb_max_validator,
):
    mp3_upload_file.size = 0
    with pytest.raises(ValueError, match="File is empty"):
        file_size_2mb_max_validator(mp3_upload_file)
