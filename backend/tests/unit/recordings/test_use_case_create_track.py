import uuid
from datetime import date

import pytest
from fastapi import UploadFile

from jamflow.infra.bootstrap import build_create_track
from jamflow.recordings.models import AudioFileFormat
from jamflow.recordings.schemas import TrackCreateDto
from jamflow.recordings.use_cases import CreateTrack
from tests.unit.fakes import (
    FakeAudioProcessor,
    FakeAudioStorage,
    FakeTrackRepository,
)


@pytest.fixture
def use_case(
    fake_track_repo: FakeTrackRepository,
    fake_audio_processor: FakeAudioProcessor,
    fake_audio_storage: FakeAudioStorage,
    mock_db_session,
) -> CreateTrack:
    return build_create_track(
        track_repo=fake_track_repo,
        audio_processor=fake_audio_processor,
        audio_storage=fake_audio_storage,
        session=mock_db_session,
    )


# TODO: replace with a polyfactory once the DTO is decoupled from fastAPI concerns
@pytest.fixture
def track_create_dto(mp3_upload_file: UploadFile) -> TrackCreateDto:
    dto = TrackCreateDto(
        title="Test Track",
        recorded_date=date.today(),
        upload_file=mp3_upload_file,
    )
    return dto


@pytest.mark.xfail(reason="Duration check happens after file storage")
async def test_format_inferr_failure_failure_prevents_persistence(
    track_create_dto: TrackCreateDto,
    fake_audio_processor: FakeAudioProcessor,
    fake_audio_storage: FakeAudioStorage,
    fake_track_repo: FakeTrackRepository,
    use_case: CreateTrack,
):
    fake_audio_processor.fail_on("get_duration", Exception("Bad file"))

    with pytest.raises(Exception, match="Bad file"):
        await use_case.execute(track_create_dto)

    assert not fake_audio_storage.files
    assert not fake_track_repo.models


async def test_format_inferr_failure_prevents_persistence(
    track_create_dto: TrackCreateDto,
    fake_audio_processor: FakeAudioProcessor,
    fake_audio_storage: FakeAudioStorage,
    fake_track_repo: FakeTrackRepository,
    use_case: CreateTrack,
):
    fake_audio_processor.fail_on("get_format", Exception("Bad file"))

    with pytest.raises(Exception, match="Bad file"):
        await use_case.execute(track_create_dto)

    assert not fake_audio_storage.files
    assert not fake_track_repo.models


async def test_uses_inferred_file_type_over_passed_one(
    track_create_dto: TrackCreateDto,
    fake_audio_processor: FakeAudioProcessor,
    use_case: CreateTrack,
):
    track_create_dto.upload_file.filename = "test.foo"
    fake_audio_processor.file_format = AudioFileFormat.OGG

    track_read_dto = await use_case.execute(track_create_dto)

    assert track_read_dto.format == AudioFileFormat.OGG


async def test_returns_track_with_correct_data(
    track_create_dto: TrackCreateDto,
    fake_audio_processor: FakeAudioProcessor,
    use_case: CreateTrack,
):
    fake_audio_processor.file_format = AudioFileFormat.MP3
    fake_audio_processor.duration = 50_000
    track_create_dto.upload_file.size = 321

    track_read_dto = await use_case.execute(track_create_dto)

    assert isinstance(track_read_dto.id, uuid.UUID)
    assert track_read_dto.format == AudioFileFormat.MP3
    assert track_read_dto.duration == 50_000
    assert track_read_dto.size == 321


async def test_creates_track_in_repository(
    track_create_dto: TrackCreateDto,
    fake_track_repo: FakeTrackRepository,
    use_case: CreateTrack,
):
    track_read_dto = await use_case.execute(track_create_dto)

    assert track_read_dto.id in fake_track_repo.models


async def test_creates_clip_in_repository(
    track_create_dto: TrackCreateDto,
    fake_audio_storage: FakeAudioStorage,
    use_case: CreateTrack,
):
    await use_case.execute(track_create_dto)

    assert len(fake_audio_storage.new_files()) == 1
