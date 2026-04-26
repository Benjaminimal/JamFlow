import uuid

import pytest

from jamflow.recordings.use_cases import ListClip
from tests.unit.factories import ClipFactory
from tests.unit.fakes import FakeClipRepository


@pytest.fixture
def use_case(
    fake_clip_repo,
    fake_audio_storage,
    mock_db_session,
) -> ListClip:
    return ListClip(
        clip_repo=fake_clip_repo,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


async def test_list_clip_without_track_id_returns_all_clips(
    use_case: ListClip,
    fake_clip_repo: FakeClipRepository,
):
    clip_1 = ClipFactory.build(track_id=uuid.uuid4())
    clip_2 = ClipFactory.build(track_id=uuid.uuid4())
    await fake_clip_repo.create(clip_1)
    await fake_clip_repo.create(clip_2)

    clip_read_dtos = await use_case.execute()

    assert len(clip_read_dtos) == 2
    assert {clip_1.id, clip_2.id} == {c.id for c in clip_read_dtos}


async def test_list_clip_filters_by_track_id(
    use_case: ListClip,
    fake_clip_repo: FakeClipRepository,
):
    filter_id = uuid.uuid4()
    clip_1 = ClipFactory.build(track_id=uuid.uuid4())
    clip_2 = ClipFactory.build(track_id=filter_id)
    await fake_clip_repo.create(clip_1)
    await fake_clip_repo.create(clip_2)

    clip_read_dtos = await use_case.execute(filter_id)

    assert len(clip_read_dtos) == 1
    assert {clip_2.id} == {c.id for c in clip_read_dtos}


async def test_clip_list_with_no_clips_returns_empty_list(
    use_case: ListClip,
):
    clip_read_dtos = await use_case.execute()

    assert len(clip_read_dtos) == 0
