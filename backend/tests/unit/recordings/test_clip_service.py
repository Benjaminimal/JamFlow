import uuid

import pytest
from pytest_mock import MockerFixture

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.recordings.models import AudioFileFormat, Clip
from jamflow.recordings.schemas import ClipReadDto
from jamflow.recordings.services.clip import clip_read


@pytest.fixture
def clip_1() -> Clip:
    return Clip(
        id=uuid.uuid4(),
        title="Test Clip 1",
        track_id=uuid.uuid4(),
        duration=900,
        start=1200,
        end=2100,
        format=AudioFileFormat.MP3,
        size=7750,
        path="path/to/clip1.mp3",
    )


@pytest.fixture
def clip_2() -> Clip:
    return Clip(
        id=uuid.uuid4(),
        title="Test Clip 2",
        track_id=uuid.uuid4(),
        duration=900,
        start=500,
        end=1400,
        format=AudioFileFormat.MP3,
        size=7800,
        path="path/to/clip2.mp3",
    )


@pytest.fixture
def mock_audio_storage(mocker: MockerFixture):
    mock_storage_service = mocker.AsyncMock()
    mock_storage_service.generate_expiring_url.return_value = "http://example.com/clip"
    mock_get_audio_storage_service = mocker.patch(
        "jamflow.recordings.services.clip.get_audio_storage_service"
    )
    mock_get_audio_storage_service.return_value.__aenter__.return_value = (
        mock_storage_service
    )
    return mock_storage_service


async def test_clip_read_returns_clip_dto_and_generates_url(
    mocker: MockerFixture,
    mock_db_session,
    mock_audio_storage,
    clip_1: Clip,
):
    mock_get_by_id = mocker.patch(
        "jamflow.recordings.services.clip.SQLModelClipRepository.get_by_id",
        new_callable=mocker.AsyncMock,
        return_value=clip_1,
    )

    result = await clip_read(mock_db_session, clip_id=clip_1.id)

    assert isinstance(result, ClipReadDto)
    assert result.title == "Test Clip 1"
    mock_get_by_id.assert_called_once_with(clip_1.id)
    mock_audio_storage.generate_expiring_url.assert_called_once_with(clip_1.path)


async def test_clip_read_with_missing_clip_raises_error(
    mocker: MockerFixture,
    mock_db_session,
):
    mock_get_by_id = mocker.patch(
        "jamflow.recordings.services.clip.SQLModelClipRepository.get_by_id",
        new_callable=mocker.AsyncMock,
        return_value=None,
    )

    with pytest.raises(ResourceNotFoundError, match="Clip not found"):
        await clip_read(mock_db_session, clip_id=uuid.uuid4())

    mock_get_by_id.assert_called_once()
