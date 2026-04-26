from typing import Awaitable, Callable

import pytest

from jamflow.recordings.models import Track
from tests.unit.factories import TrackFactory
from tests.unit.fakes import FakeAudioStorage, FakeTrackRepository

CreatePersistedTrack = Callable[..., Awaitable[Track]]


@pytest.fixture
async def create_persisted_track(
    fake_track_repo: FakeTrackRepository,
    fake_audio_storage: FakeAudioStorage,
) -> CreatePersistedTrack:
    async def _create_persisted_track(track: Track | None = None) -> Track:
        track = track or TrackFactory.build()
        await fake_track_repo.create(track)
        async with fake_audio_storage as storage:
            await storage.store_file(b"", path=track.path, content_type="noone/cares")
        return track

    return _create_persisted_track
