import pytest
from fastapi import UploadFile
from pytest_mock import MockerFixture

from jamflow.schemas.validators import (
    empty_string_to_none,
    get_file_size_validator,
    validate_audo_file_format,
)

pytestmark = pytest.mark.unit


@pytest.fixture
def mock_upload_file(mocker: MockerFixture):
    return mocker.Mock(spec=UploadFile)


def test_empty_string_to_none():
    assert empty_string_to_none("") is None
    assert empty_string_to_none(None) is None
    assert empty_string_to_none("test") == "test"


def test_validate_audo_file_format_valid(mock_upload_file):
    mock_upload_file.filename = "test.mp3"
    assert validate_audo_file_format(mock_upload_file) == mock_upload_file


def test_validate_audo_file_format_invalid(mock_upload_file):
    mock_upload_file.filename = "test.txt"
    with pytest.raises(ValueError, match="File format 'TXT' not supported"):
        validate_audo_file_format(mock_upload_file)


def test_validate_audo_file_format_empty_filename(mock_upload_file):
    mock_upload_file.filename = None
    with pytest.raises(ValueError, match="File name is empty"):
        validate_audo_file_format(mock_upload_file)


@pytest.fixture
def file_size_2mb_max_validator():
    return get_file_size_validator(2 * 1024 * 1024)  # 2 MB max


def test_get_file_size_validator_valid(mock_upload_file, file_size_2mb_max_validator):
    mock_upload_file.size = 2 * 1024 * 1024  # 2 MB
    assert file_size_2mb_max_validator(mock_upload_file) == mock_upload_file


def test_get_file_size_validator_too_large(
    mock_upload_file, file_size_2mb_max_validator
):
    mock_upload_file.size = 3 * 1024 * 1024 + 1  # 2 MB + 1 byte
    with pytest.raises(ValueError, match="File is larger than 2 MB"):
        file_size_2mb_max_validator(mock_upload_file)


def test_get_file_size_validator_empty_file(
    mock_upload_file, file_size_2mb_max_validator
):
    mock_upload_file.size = 0
    with pytest.raises(ValueError, match="File is empty"):
        file_size_2mb_max_validator(mock_upload_file)
