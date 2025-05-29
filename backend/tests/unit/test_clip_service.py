import pytest
from pytest_mock import MockerFixture

from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.clip import clip_create
from jamflow.services.exceptions import ResourceNotFoundException, ValidationException


@pytest.fixture
def mock_audio_storage(mocker: MockerFixture):
    mock_storage_service = mocker.AsyncMock()
    mock_storage_service.generate_expiring_url.return_value = "http://example.com/clip"
    mock_get_audio_storage_service = mocker.patch(
        "jamflow.services.clip.get_audio_storage_service"
    )
    mock_get_audio_storage_service.return_value.__aenter__.return_value = (
        mock_storage_service
    )
    return mock_storage_service


async def test_clip_create_success(
    mocker: MockerFixture,
    mock_session,
    mock_audio_storage,
    mp3_file,
):
    # TODO: who closes the file?
    mock_audio_storage.get_file.return_value = open(mp3_file, "rb")
    mock_session.get.return_value = mocker.MagicMock(
        id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        path="path/to/track.mp3",
        format="MP3",
        duration=2500,
    )
    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        start=1200,
        end=2100,
    )

    result = await clip_create(mock_session, clip_create_dto=clip_create_dto)

    mock_session.add.assert_called_once()

    assert isinstance(result, ClipReadDto)
    assert result.id is not None
    assert result.title == "Test Clip"
    assert str(result.track_id) == "5ec9fcfb-078a-4867-9ff1-4cb0c7105696"
    assert result.duration == 900
    assert result.start == 1200
    assert result.end == 2100
    assert result.format == "MP3"
    assert 2000 <= result.size <= 3000
    assert str(result.url) == "http://example.com/clip"


async def test_clip_create_track_not_found_error(mock_session):
    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb078a48679ff14cb0c7105696",
        start=1200,
        end=2100,
    )

    # Simulate track not found
    mock_session.get.return_value = None

    with pytest.raises(ResourceNotFoundException, match="Track not found"):
        await clip_create(mock_session, clip_create_dto=clip_create_dto)


async def test_clip_create_with_end_gt_track_length_raises_exception(
    mocker: MockerFixture,
    mock_session,
):
    mock_session.get.return_value = mocker.MagicMock(duration=2000)

    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        start=1000,
        end=3000,
    )

    with pytest.raises(
        ValidationException, match="Clip end time exceeds track duration"
    ):
        await clip_create(mock_session, clip_create_dto=clip_create_dto)
