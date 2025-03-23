from datetime import date

import pytest
from fastapi import UploadFile
from pydantic import ValidationError

from jamflow.schemas.track import TrackCreateDto

pytestmark = pytest.mark.unit


@pytest.mark.parametrize("recorded_date", ["", None, date.today()])
def test_track_create_dto_success(recorded_date, mp3_upload_file: UploadFile):
    dto = TrackCreateDto(
        title="Test Track",
        recorded_date=recorded_date,
        upload_file=mp3_upload_file,
    )
    expected_recorded_date = None if recorded_date == "" else recorded_date
    assert dto.title == "Test Track"
    assert dto.recorded_date == expected_recorded_date
    assert dto.upload_file == mp3_upload_file


@pytest.mark.parametrize(
    "title,expected_message",
    [
        ("", "String should have at least 1 character"),
        (" ", "String should have at least 1 character"),
        ("\n", "String should have at least 1 character"),
        ("\t", "String should have at least 1 character"),
        ("\r", "String should have at least 1 character"),
        ("\f", "String should have at least 1 character"),
        ("\v", "String should have at least 1 character"),
        ("A" * 256, "String should have at most 255 characters"),
    ],
)
def test_track_create_dto_title_error(
    title, expected_message, mp3_upload_file: UploadFile
):
    with pytest.raises(ValidationError, match=expected_message):
        TrackCreateDto(
            title=title,
            recorded_date=date.today(),
            upload_file=mp3_upload_file,
        )


@pytest.fixture
def empty_mp3_upload_file(mp3_upload_file: UploadFile) -> UploadFile:
    return UploadFile(
        filename=mp3_upload_file.filename, file=mp3_upload_file.file, size=0
    )


@pytest.fixture
def huge_mp3_upload_file(mp3_upload_file: UploadFile) -> UploadFile:
    return UploadFile(
        filename=mp3_upload_file.filename, file=mp3_upload_file.file, size=209715201
    )


@pytest.mark.parametrize(
    "upload_file,expected_message",
    [
        (
            "empty_mp3_upload_file",
            "File is empty",
        ),
        (
            "huge_mp3_upload_file",
            "File is larger than 200 MB",
        ),
        (
            "txt_upload_file",
            "Unsupported file format. Supported formats: MP3, WAV, OGG",
        ),
    ],
)
def test_track_create_dto_upload_file_error(
    upload_file: str, expected_message: str, request: pytest.FixtureRequest
):
    upload_file: UploadFile = request.getfixturevalue(upload_file)
    with pytest.raises(ValidationError, match=expected_message):
        TrackCreateDto(
            title="Test Track",
            recorded_date=date.today(),
            upload_file=upload_file,
        )
