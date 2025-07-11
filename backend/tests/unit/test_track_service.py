import uuid
from datetime import date, timedelta
from io import BytesIO

import pytest
from fastapi import UploadFile
from pytest_mock import MockerFixture

from jamflow.core.exceptions import ResourceNotFoundError, ValidationError
from jamflow.models import Track
from jamflow.models.enums import AudioFileFormat
from jamflow.schemas.track import TrackCreateDto, TrackReadDto, TrackSignedUrlDto
from jamflow.services.track import (
    track_create,
    track_generate_signed_urls,
    track_list,
    track_read,
)
from jamflow.utils import timezone_now


@pytest.fixture
def mock_audio_storage(mocker: MockerFixture):
    mock_storage_service = mocker.AsyncMock()
    mock_storage_service.generate_expiring_url.return_value = "http://example.com/track"
    mock_get_audio_storage_service = mocker.patch(
        "jamflow.services.track.get_audio_storage_service"
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


async def test_track_create_returns_valid_track_dto_and_stores_file(
    mock_db_session,
    mock_audio_storage,
    track_create_dto: TrackCreateDto,
):
    track_read_dto = await track_create(
        session=mock_db_session, track_create_dto=track_create_dto
    )

    assert isinstance(track_read_dto, TrackReadDto)
    assert track_read_dto.id is not None
    assert track_read_dto.created_at is not None
    assert track_read_dto.updated_at is not None
    assert track_read_dto.title == track_create_dto.title
    assert 2400 <= track_read_dto.duration <= 2600
    assert track_read_dto.size == track_create_dto.upload_file.size
    assert track_read_dto.format == AudioFileFormat.MP3
    assert track_read_dto.recorded_date == track_create_dto.recorded_date
    assert track_read_dto.url is not None
    assert str(track_read_dto.url).startswith("http://example.com/track")

    mock_audio_storage.store_file.assert_called_once()
    mock_audio_storage.generate_expiring_url.assert_called_once()


async def test_track_create_with_wrong_extension_saves_with_correct_extension(
    mock_db_session,
    mock_audio_storage,
    track_create_dto: TrackCreateDto,
):
    # even with a wrong extension
    track_create_dto.upload_file.filename = "test.foo"
    track_read_dto = await track_create(
        session=mock_db_session, track_create_dto=track_create_dto
    )

    # the service should still be able to determine correct file format
    assert track_read_dto.format == AudioFileFormat.MP3
    # and save it with the correct extension
    mock_audio_storage.store_file.assert_called_once()
    path_kwarg = mock_audio_storage.store_file.call_args[1]["path"]
    assert path_kwarg.endswith(".mp3")


async def test_track_create_raises_validation_exception_when_audio_duration_fails(
    mocker: MockerFixture,
    mock_db_session,
    track_create_dto: TrackCreateDto,
):
    mocker.patch(
        "jamflow.services.track.get_audio_duration",
        side_effect=ValidationError("Test error"),
    )

    with pytest.raises(ValidationError, match="Test error"):
        await track_create(session=mock_db_session, track_create_dto=track_create_dto)


async def test_track_list_returns_track_dtos_and_generates_url(
    mocker: MockerFixture,
    mock_audio_storage,
    track_1: Track,
    track_2: Track,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = [track_1, track_2]
    mock_db_session = mocker.AsyncMock()
    mock_db_session.exec.return_value = mock_result

    result = await track_list(mock_db_session)

    assert len(result) == 2
    assert isinstance(result[0], TrackReadDto)
    assert result[0].title == "Track 1"
    mock_db_session.exec.assert_called_once()
    mock_audio_storage.generate_expiring_url.assert_called()


async def test_track_read_returns_track_dto_and_generates_urls(
    mock_db_session,
    mock_audio_storage,
    track_1: Track,
):
    mock_db_session.get.return_value = track_1

    result = await track_read(mock_db_session, track_id=track_1.id)

    assert isinstance(result, TrackReadDto)
    assert result.title == "Track 1"
    mock_db_session.get.assert_called_once_with(Track, track_1.id)
    mock_audio_storage.generate_expiring_url.assert_called_once_with(track_1.path)


async def test_track_read_with_missing_track_rasies_error(mocker: MockerFixture):
    mock_db_session = mocker.AsyncMock()
    mock_db_session.get.return_value = None

    with pytest.raises(ResourceNotFoundError, match="Track not found"):
        await track_read(mock_db_session, track_id=uuid.uuid4())

    mock_db_session.get.assert_called_once()


async def test_track_generate_signed_urls_returns_dtos_with_url_and_expiry(
    mocker: MockerFixture,
    mock_db_session,
    mock_audio_storage,
    track_1: Track,
    track_2: Track,
):
    track_ids = [track_1.id, track_2.id]
    mock_expiring_urls = ["http://example.com/track1", "http://example.com/track2"]
    expires_at_min = timezone_now() + timedelta(hours=1)
    expires_at_max = expires_at_min + timedelta(seconds=1)

    mock_result = mocker.MagicMock()
    mock_result.all.return_value = [track_1, track_2]
    mock_db_session.exec.return_value = mock_result
    mock_audio_storage.generate_expiring_url.side_effect = mock_expiring_urls

    result = await track_generate_signed_urls(
        session=mock_db_session, track_ids=track_ids
    )

    assert len(result) == 2
    for i, dto in enumerate(result):
        assert isinstance(dto, TrackSignedUrlDto)
        assert dto.track_id == track_ids[i]
        assert dto.url == mock_expiring_urls[i]
        assert expires_at_min <= dto.expires_at <= expires_at_max + timedelta(seconds=1)
