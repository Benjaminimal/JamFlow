from datetime import date
from io import BytesIO

import pytest
from fastapi import UploadFile
from pytest_mock import MockerFixture

from jamflow.models.enums import FileFormat
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.track import track_create

pytestmark = pytest.mark.unit


@pytest.fixture
def mock_session(mocker: MockerFixture):
    session = mocker.AsyncMock()
    session.add = mocker.Mock()  # Explicitly mock `add` as a synchronous method
    return session


@pytest.fixture
def mock_track_storage(mocker: MockerFixture):
    mock_storage_service = mocker.AsyncMock()
    mock_get_track_storage_service = mocker.patch(
        "jamflow.services.track.get_track_storage_service"
    )
    mock_get_track_storage_service.return_value.__aenter__.return_value = (
        mock_storage_service
    )
    return mock_storage_service


@pytest.fixture
def dummy_mp3_upload_file() -> UploadFile:
    dummy_file = BytesIO(b"dummy content")
    size = len(dummy_file.getvalue())
    upload_file = UploadFile(filename="test.mp3", size=size, file=dummy_file)
    return upload_file


@pytest.fixture
def track_create_dto(dummy_mp3_upload_file: UploadFile):
    dto = TrackCreateDto(
        title="Test Track",
        recorded_date=date.today(),
        upload_file=dummy_mp3_upload_file,
    )
    return dto


async def test_track_create_success(
    mock_session, mock_track_storage, track_create_dto: TrackCreateDto
):
    track_read_dto = await track_create(
        session=mock_session, track_create_dto=track_create_dto
    )

    assert isinstance(track_read_dto, TrackReadDto)
    assert track_read_dto.title == track_create_dto.title
    assert track_read_dto.file_size == track_create_dto.upload_file.size
    assert track_read_dto.file_format == FileFormat.MP3
    mock_track_storage.store_file.assert_called_once()
    mock_track_storage.store_file.assert_called_once()
