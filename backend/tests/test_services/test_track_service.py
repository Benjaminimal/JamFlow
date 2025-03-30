import uuid
from datetime import date
from io import BytesIO

import pytest
from fastapi import UploadFile
from pytest_mock import MockerFixture, MockFixture

from jamflow.models import Track
from jamflow.models.enums import AudioFileFormat
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.audio import AudioServiceException
from jamflow.services.exceptions import ResourceNotFoundException, ValidationException
from jamflow.services.track import track_create, track_list, track_read

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


async def test_track_create_success(
    mock_session, mock_track_storage, track_create_dto: TrackCreateDto
):
    track_read_dto = await track_create(
        session=mock_session, track_create_dto=track_create_dto
    )

    assert isinstance(track_read_dto, TrackReadDto)
    assert track_read_dto.id is not None
    assert track_read_dto.created_at is not None
    assert track_read_dto.updated_at is not None
    assert track_read_dto.title == track_create_dto.title
    assert 2400 <= track_read_dto.duration <= 2600
    assert track_read_dto.size == track_create_dto.upload_file.size
    assert track_read_dto.format == AudioFileFormat.MP3
    mock_track_storage.store_file.assert_called_once()
    mock_track_storage.store_file.assert_called_once()


async def test_track_create_wrong_extension_success(
    mock_session, mock_track_storage, track_create_dto: TrackCreateDto
):
    # even with a wrong extension
    track_create_dto.upload_file.filename = "test.foo"
    track_read_dto = await track_create(
        session=mock_session, track_create_dto=track_create_dto
    )

    # the service should still be able to determine correct file format
    assert track_read_dto.format == AudioFileFormat.MP3
    # and save it with the correct extension
    mock_track_storage.store_file.assert_called_once()
    path_kwarg = mock_track_storage.store_file.call_args[1]["path"]
    assert path_kwarg.endswith(".mp3")


async def test_track_create_no_duration_error(
    mocker: MockFixture,
    mock_session,
    mock_track_storage,
    track_create_dto: TrackCreateDto,
):
    mocker.patch(
        "jamflow.services.track.get_audio_duration",
        side_effect=AudioServiceException("Test error"),
    )

    with pytest.raises(ValidationException, match="Failed to get audio duration"):
        await track_create(session=mock_session, track_create_dto=track_create_dto)


async def test_track_list_success(
    mocker: MockerFixture,
    track_1: Track,
    track_2: Track,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = [track_1, track_2]
    mock_session = mocker.AsyncMock()
    mock_session.exec.return_value = mock_result

    result = await track_list(mock_session)

    assert len(result) == 2
    assert isinstance(result[0], TrackReadDto)
    assert result[0].title == "Track 1"
    mock_session.exec.assert_called_once()


async def test_track_read_success(mocker: MockerFixture, track_1: Track):
    mock_session = mocker.AsyncMock()
    mock_session.get.return_value = track_1

    result = await track_read(mock_session, track_id=track_1.id)

    assert isinstance(result, TrackReadDto)
    assert result.title == "Track 1"
    mock_session.get.assert_called_once_with(Track, track_1.id)


async def test_track_read_not_found(mocker: MockerFixture):
    mock_session = mocker.AsyncMock()
    mock_session.get.return_value = None

    with pytest.raises(ResourceNotFoundException, match="Track not found"):
        await track_read(mock_session, track_id=uuid.uuid4())

    mock_session.get.assert_called_once()
