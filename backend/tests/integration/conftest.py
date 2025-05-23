import pytest

from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.track import track_create
from tests.fixtures.http import client, simple_client  # noqa: F401


@pytest.fixture
async def track_1(db_session, track_storage, mp3_upload_file) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track mp3",
        recorded_date="2021-02-03",
        upload_file=mp3_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_2(db_session, track_storage, ogg_upload_file) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track ogg",
        recorded_date="2022-04-05",
        upload_file=ogg_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_3(db_session, track_storage, wav_upload_file) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track wav",
        recorded_date="2023-06-07",
        upload_file=wav_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)
