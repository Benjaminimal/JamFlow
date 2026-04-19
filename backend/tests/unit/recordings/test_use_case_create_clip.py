import uuid

import pytest

from jamflow.core.exceptions import ResourceNotFoundError, ValidationError
from jamflow.recordings.models import AudioFileFormat
from jamflow.recordings.use_cases import CreateClip
from tests.unit.factories import ClipCreateDtoFactory, TrackFactory
from tests.unit.fakes import (
    FakeAudioProcessor,
    FakeAudioStorage,
    FakeClipRepository,
    FakeTrackRepository,
)


@pytest.fixture
def fake_clip_repo() -> FakeClipRepository:
    return FakeClipRepository()


@pytest.fixture
def fake_track_repo() -> FakeTrackRepository:
    return FakeTrackRepository()


@pytest.fixture
def fake_audio_processor() -> FakeAudioProcessor:
    return FakeAudioProcessor(
        duration=3_000,
        size=123,
    )


@pytest.fixture
def fake_audio_storage() -> FakeAudioStorage:
    return FakeAudioStorage()


@pytest.fixture
def use_case(
    fake_clip_repo,
    fake_track_repo,
    fake_audio_processor,
    fake_audio_storage,
    mock_db_session,
) -> CreateClip:
    return CreateClip(
        clip_repo=fake_clip_repo,
        track_repo=fake_track_repo,
        audio_processor=fake_audio_processor,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


async def test_create_clip_with_non_existent_track_raises_exception(
    use_case: CreateClip,
):
    clip_create_dto = ClipCreateDtoFactory.build()

    with pytest.raises(ResourceNotFoundError, match="Track not found"):
        await use_case.execute(clip_create_dto)


async def test_create_clip_with_end_exceeds_track_duration_raises_validation_error(
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


async def test_clip_create_returns_clip_with_correct_data(
    use_case: CreateClip,
    fake_track_repo: FakeTrackRepository,
    fake_audio_storage: FakeAudioStorage,
    fake_clip_repo: FakeClipRepository,
):
    track = TrackFactory.build(duration=60_000, format=AudioFileFormat.WAV)
    await fake_track_repo.create(track)
    async with fake_audio_storage as storage:
        await storage.store_file(b"", path=track.path, content_type="noone/cares")

    files_before = set(fake_audio_storage.files.keys())

    clip_create_dto = ClipCreateDtoFactory.build(
        track_id=track.id,
        start=1_000,
        end=4_000,
    )

    clip_read_dto = await use_case.execute(clip_create_dto)

    files_after = set(fake_audio_storage.files.keys())
    files_added = files_after - files_before

    # data integrity
    assert clip_read_dto.track_id == track.id
    assert isinstance(clip_read_dto.id, uuid.UUID)

    # persistence
    assert len(files_added) == 1
    assert clip_read_dto.id in fake_clip_repo.models

    # metadata
    assert clip_read_dto.duration == 3_000
    assert clip_read_dto.format == AudioFileFormat.WAV
    assert clip_read_dto.size == 123
    url = str(clip_read_dto.url)
    assert url.startswith("http://bogus.url")
