import uuid
from datetime import date
from io import BytesIO

import pytest
from fastapi import UploadFile
from pytest_mock import MockerFixture

from jamflow.recordings.models import AudioFileFormat, Track
from jamflow.recordings.schemas import TrackCreateDto, TrackReadDto
from jamflow.recordings.services.track import track_list


@pytest.fixture
def mock_audio_storage(mocker: MockerFixture):
    mock_storage_service = mocker.AsyncMock()
    mock_storage_service.generate_expiring_url.return_value = "http://example.com/track"
    mock_get_audio_storage_service = mocker.patch(
        "jamflow.recordings.services.track.get_audio_storage_service"
    )
    mock_get_audio_storage_service.return_value.__aenter__.return_value = (
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
def track_create_dto(mp3_upload_file: UploadFile):
    dto = TrackCreateDto(
        title="Test Track",
        recorded_date=date.today(),
        upload_file=mp3_upload_file,
    )
    return dto


@pytest.fixture
def track_1() -> Track:
    return Track(
        id=uuid.uuid4(),
        title="Track 1",
        duration=2400,
        format=AudioFileFormat.MP3,
        size=1234,
        path="path/to/track.mp3",
        recorded_date=date.today(),
    )


@pytest.fixture
def track_2() -> Track:
    return Track(
        id=uuid.uuid4(),
        title="Track 2",
        duration=3700,
        format=AudioFileFormat.OGG,
        size=5678,
        path="path/to/track.ogg",
        recorded_date=date.today(),
    )


async def test_track_list_returns_track_dtos_and_generates_url(
    mocker: MockerFixture,
    mock_db_session,
    mock_audio_storage,
    track_1: Track,
    track_2: Track,
):
    mock_list_all = mocker.patch(
        "jamflow.recordings.services.track.SQLModelTrackRepository.list_all",
        new_callable=mocker.AsyncMock,
        return_value=[track_1, track_2],
    )

    result = await track_list(mock_db_session)

    assert len(result) == 2
    assert isinstance(result[0], TrackReadDto)
    assert result[0].title == "Track 1"
    mock_list_all.assert_called_once()
    mock_audio_storage.generate_expiring_url.assert_called()
