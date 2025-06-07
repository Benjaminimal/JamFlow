import uuid

import pytest
from pytest_mock import MockerFixture

from jamflow.models.clip import Clip
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.clip import clip_create, clip_list, clip_read
from jamflow.services.exceptions import ResourceNotFoundException, ValidationException


@pytest.fixture
def clip_1() -> Clip:
    return Clip(
        id=uuid.uuid4(),
        title="Test Clip 1",
        track_id=uuid.uuid4(),
        duration=900,
        start=1200,
        end=2100,
        format="mp3",
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
        format="mp3",
        size=7800,
        path="path/to/clip2.mp3",
    )


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


async def test_clip_create_returns_clip_with_calculated_metadata(
    mocker: MockerFixture,
    mock_db_session,
    mock_audio_storage,
    mp3_file,
):
    mock_audio_storage.get_file.return_value = open(mp3_file, "rb")
    mock_db_session.get.return_value = mocker.MagicMock(
        id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        path="path/to/track.mp3",
        format="mp3",
        duration=2500,
    )
    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        start=1200,
        end=2100,
    )

    result = await clip_create(mock_db_session, clip_create_dto=clip_create_dto)

    mock_db_session.add.assert_called_once()

    assert isinstance(result, ClipReadDto)
    assert result.id is not None
    assert result.title == "Test Clip"
    assert str(result.track_id) == "5ec9fcfb-078a-4867-9ff1-4cb0c7105696"
    assert result.duration == 900
    assert result.start == 1200
    assert result.end == 2100
    assert result.format == "mp3"
    assert 7700 <= result.size <= 7800
    assert str(result.url) == "http://example.com/clip"


async def test_clip_create_with_non_existent_track_raises_exception(mock_db_session):
    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb078a48679ff14cb0c7105696",
        start=1200,
        end=2100,
    )

    # Simulate track not found
    mock_db_session.get.return_value = None

    with pytest.raises(ResourceNotFoundException, match="Track not found"):
        await clip_create(mock_db_session, clip_create_dto=clip_create_dto)


async def test_clip_create_with_end_gt_track_length_raises_exception(
    mocker: MockerFixture,
    mock_db_session,
):
    mock_db_session.get.return_value = mocker.MagicMock(duration=2000)

    clip_create_dto = ClipCreateDto(
        title="Test Clip",
        track_id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696",
        start=1000,
        end=3000,
    )

    with pytest.raises(
        ValidationException, match="Clip end time exceeds track duration"
    ):
        await clip_create(mock_db_session, clip_create_dto=clip_create_dto)


async def test_clip_list_retruns_clip_dtos_and_generates_url(
    mocker: MockerFixture,
    mock_db_session,
    mock_audio_storage,
    clip_1: Clip,
    clip_2: Clip,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = [clip_1, clip_2]
    mock_db_session.exec.return_value = mock_result

    result = await clip_list(mock_db_session)

    assert len(result) == 2
    assert isinstance(result[0], ClipReadDto)
    assert result[0].title == "Test Clip 1"
    mock_db_session.exec.assert_called_once()
    mock_audio_storage.generate_expiring_url.assert_called()


async def test_clip_list_filters_by_track_id(
    mocker: MockerFixture,
    mock_db_session,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = []
    mock_db_session.exec.return_value = mock_result

    mock_select = mocker.patch("jamflow.services.clip.select")
    mock_statement = mock_select.return_value
    mock_statement.where.return_value = mock_statement

    fake_track_id = uuid.uuid4()

    await clip_list(mock_db_session, track_id=fake_track_id)

    mock_statement.where.assert_called_once()
    args, _ = mock_statement.where.call_args
    assert str(args[0]) == str(Clip.track_id == fake_track_id)


async def test_clip_list_with_no_clips_returns_empty_list(
    mocker: MockerFixture,
    mock_db_session,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = []
    mock_db_session.exec.return_value = mock_result

    result = await clip_list(mock_db_session)

    assert result == []
    mock_db_session.exec.assert_called_once()


async def test_clip_list_with_track_id_filter_returns_filtered_clips(
    mocker: MockerFixture,
    mock_db_session,
    clip_1: Clip,
    clip_2: Clip,  # noqa: ARG001
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = [clip_1]
    mock_db_session.exec.return_value = mock_result

    result = await clip_list(mock_db_session, track_id=clip_1.track_id)

    assert len(result) == 1
    assert result[0].id == clip_1.id
    assert result[0].title == clip_1.title
    mock_db_session.exec.assert_called_once()


async def test_clip_list_with_non_existent_track_id_returns_empty_list(
    mocker: MockerFixture,
    mock_db_session,
):
    mock_result = mocker.MagicMock()
    mock_result.all.return_value = []
    mock_db_session.exec.return_value = mock_result

    result = await clip_list(mock_db_session, track_id=uuid.uuid4())

    assert result == []
    mock_db_session.exec.assert_called_once()


async def test_clip_read_returns_clip_dto_and_generates_url(
    mock_db_session,
    mock_audio_storage,
    clip_1: Clip,
):
    mock_db_session.get.return_value = clip_1

    result = await clip_read(mock_db_session, clip_id=clip_1.id)

    assert isinstance(result, ClipReadDto)
    assert result.title == "Test Clip 1"
    mock_db_session.get.assert_called_once_with(Clip, clip_1.id)
    mock_audio_storage.generate_expiring_url.assert_called_once_with(clip_1.path)


async def test_clip_read_with_missing_clip_raises_error(mock_db_session):
    mock_db_session.get.return_value = None

    with pytest.raises(ResourceNotFoundException, match="Clip not found"):
        await clip_read(mock_db_session, clip_id=uuid.uuid4())

    mock_db_session.get.assert_called_once()
