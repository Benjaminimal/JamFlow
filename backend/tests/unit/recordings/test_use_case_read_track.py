import uuid
from unittest.mock import AsyncMock

import pytest

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.infra.bootstrap import build_read_track
from jamflow.recordings.use_cases import ReadTrack
from tests.unit.fakes import FakeAudioStorage, FakeTrackRepository
from tests.unit.recordings.conftest import CreatePersistedTrack


@pytest.fixture
def use_case(
    fake_track_repo: FakeTrackRepository,
    fake_audio_storage: FakeAudioStorage,
    mock_db_session: AsyncMock,
) -> ReadTrack:
    return build_read_track(
        track_repo=fake_track_repo,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


async def test_with_missing_track_raises_error(
    use_case: ReadTrack,
):
    with pytest.raises(ResourceNotFoundError, match="Track not found"):
        await use_case.execute(uuid.uuid4())


async def test_returns_correct_track(
    use_case: ReadTrack,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()
    await create_persisted_track()

    track_read_dto = await use_case.execute(track.id)

    assert track_read_dto.id == track.id


async def test_reads_from_audio_storage(
    use_case: ReadTrack,
    fake_audio_storage: FakeAudioStorage,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()

    track_read_dto = await use_case.execute(track.id)

    stored_paths = fake_audio_storage.files.keys()
    assert track_read_dto.url.path in stored_paths
