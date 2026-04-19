import uuid

import pytest

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.recordings.use_cases import ReadClip
from tests.unit.factories import ClipFactory
from tests.unit.fakes import FakeAudioStorage, FakeClipRepository


@pytest.fixture
def fake_clip_repo() -> FakeClipRepository:
    return FakeClipRepository()


@pytest.fixture
def fake_audio_storage() -> FakeAudioStorage:
    return FakeAudioStorage()


@pytest.fixture
def use_case(
    fake_clip_repo,
    fake_audio_storage,
    mock_db_session,
) -> ReadClip:
    return ReadClip(
        clip_repo=fake_clip_repo,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


async def test_clip_read_with_missing_clip_raises_error(
    use_case: ReadClip,
):
    with pytest.raises(ResourceNotFoundError, match="Clip not found"):
        await use_case.execute(uuid.uuid4())


async def test_clip_read_returns_correct_clip(
    use_case: ReadClip,
    fake_clip_repo: FakeClipRepository,
):
    clip_1, clip_2 = ClipFactory.batch(2)
    await fake_clip_repo.create(clip_1)
    await fake_clip_repo.create(clip_2)

    clip_read_dto = await use_case.execute(clip_1.id)

    assert clip_read_dto.id == clip_1.id
