from unittest.mock import AsyncMock

import pytest

from jamflow.infra.bootstrap import build_list_track
from jamflow.recordings.use_cases import ListTrack
from tests.unit.fakes import FakeAudioStorage, FakeTrackRepository
from tests.unit.recordings.conftest import CreatePersistedTrack


@pytest.fixture
def use_case(
    fake_track_repo: FakeTrackRepository,
    fake_audio_storage: FakeAudioStorage,
    mock_db_session: AsyncMock,
) -> ListTrack:
    return build_list_track(
        track_repo=fake_track_repo,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


async def test_returns_all_tracks(
    use_case: ListTrack,
    create_persisted_track: CreatePersistedTrack,
):
    track_1 = await create_persisted_track()
    track_2 = await create_persisted_track()

    track_read_dtos = await use_case.execute()

    assert len(track_read_dtos) == 2
    assert {track_1.id, track_2.id} == {c.id for c in track_read_dtos}


async def test_with_no_tracks_returns_empty_list(
    use_case: ListTrack,
):
    track_read_dtos = await use_case.execute()

    assert len(track_read_dtos) == 0


async def test_read_from_audio_storage(
    use_case: ListTrack,
    fake_audio_storage: FakeAudioStorage,
    create_persisted_track: CreatePersistedTrack,
):
    await create_persisted_track()
    await create_persisted_track()

    track_read_dto_1, track_read_dto_2 = await use_case.execute()

    stored_paths = fake_audio_storage.files.keys()
    assert track_read_dto_1.url.path in stored_paths
    assert track_read_dto_2.url.path in stored_paths
