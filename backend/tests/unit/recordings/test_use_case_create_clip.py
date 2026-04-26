import uuid
from typing import Awaitable, Callable

import pytest

from jamflow.core.exceptions import ResourceNotFoundError, ValidationError
from jamflow.recordings.models import AudioFileFormat, Track
from jamflow.recordings.use_cases import CreateClip
from tests.unit.factories import ClipCreateDtoFactory, TrackFactory
from tests.unit.fakes import (
    FakeAudioProcessor,
    FakeAudioStorage,
    FakeClipRepository,
    FakeTrackRepository,
)


@pytest.fixture
def use_case(
    fake_clip_repo: FakeClipRepository,
    fake_track_repo: FakeTrackRepository,
    fake_audio_processor: FakeAudioProcessor,
    fake_audio_storage: FakeAudioStorage,
    mock_db_session,
) -> CreateClip:
    return CreateClip(
        clip_repo=fake_clip_repo,
        track_repo=fake_track_repo,
        audio_processor=fake_audio_processor,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


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


async def test_non_existent_track_raises_exception(
    use_case: CreateClip,
):
    clip_create_dto = ClipCreateDtoFactory.build()

    with pytest.raises(ResourceNotFoundError, match="Track not found"):
        await use_case.execute(clip_create_dto)


async def test_end_exceeds_track_duration_raises_validation_error(
    use_case: CreateClip,
    fake_track_repo: FakeTrackRepository,
    fake_audio_storage: FakeAudioStorage,
):
    track = TrackFactory.build(duration=60_000)
    await fake_track_repo.create(track)

    clip_create_dto = ClipCreateDtoFactory.build(
        track_id=track.id,
        start=track.duration - 1_000,
        end=track.duration + 1,
    )

    with pytest.raises(ValidationError, match="exceeds track duration"):
        await use_case.execute(clip_create_dto)

    # no heavy IO was performed
    assert not fake_audio_storage.files


async def test_creates_clip_in_repository(
    use_case: CreateClip,
    fake_clip_repo: FakeClipRepository,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()
    clip_create_dto = ClipCreateDtoFactory.build(track_id=track.id)

    clip_read_dto = await use_case.execute(clip_create_dto)

    assert clip_read_dto.id in fake_clip_repo.models


async def test_stores_file_in_audio_storage(
    use_case: CreateClip,
    fake_audio_storage: FakeAudioStorage,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()
    files_before = set(fake_audio_storage.files.keys())
    clip_create_dto = ClipCreateDtoFactory.build(track_id=track.id)

    await use_case.execute(clip_create_dto)

    files_after = set(fake_audio_storage.files.keys())
    files_added = files_after - files_before

    assert len(files_added) == 1


async def test_returns_clip_with_correct_identity(
    use_case: CreateClip,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()
    clip_create_dto = ClipCreateDtoFactory.build(track_id=track.id)

    clip_read_dto = await use_case.execute(clip_create_dto)

    assert clip_read_dto.track_id == track.id
    assert isinstance(clip_read_dto.id, uuid.UUID)


async def test_returns_clip_with_audio_metadata(
    use_case: CreateClip,
    fake_audio_processor: FakeAudioProcessor,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track(TrackFactory.build(format=AudioFileFormat.WAV))
    fake_audio_processor.duration = 3_000
    fake_audio_processor.size = 123

    clip_create_dto = ClipCreateDtoFactory.build(
        track_id=track.id,
        start=1_000,
        end=4_000,
    )

    clip_read_dto = await use_case.execute(clip_create_dto)

    assert clip_read_dto.duration == 3_000
    assert clip_read_dto.format == AudioFileFormat.WAV
    assert clip_read_dto.size == 123


async def test_returns_clip_with_valid_url(
    use_case: CreateClip,
    create_persisted_track: CreatePersistedTrack,
):
    track = await create_persisted_track()
    clip_create_dto = ClipCreateDtoFactory.build(track_id=track.id)

    clip_read_dto = await use_case.execute(clip_create_dto)

    url = str(clip_read_dto.url)
    assert url.startswith("http://bogus.url")
