import pytest
from pytest_mock import MockerFixture

from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.clip import clip_create
from jamflow.services.exceptions import ResourceNotFoundException


@pytest.fixture
def mock_session(mocker: MockerFixture):
    session = mocker.AsyncMock()
    return session


async def test_clip_create_success(mocker: MockerFixture, mock_session):
    mock_session.get.return_value = mocker.MagicMock(
        id="5ec9fcfb-078a-4867-9ff1-4cb0c7105696"
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
    assert result.start == 1200
    assert result.end == 2100


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
