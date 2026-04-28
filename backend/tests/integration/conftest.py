from datetime import date

import pytest
from fastapi import UploadFile
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.infra.bootstrap import build_create_clip, build_create_track
from jamflow.recordings.schemas import (
    ClipCreateDto,
    ClipReadDto,
    TrackCreateDto,
    TrackReadDto,
)
from jamflow.recordings.use_cases import CreateClip, CreateTrack


@pytest.fixture
def count_rows(pg_session: AsyncSession):
    """
    Returns a coroutine that counts rows in the given model.
    """

    async def _count_rows(model, column=None):
        col_to_count = col(column) if column else col(model.id)
        statement = select(func.count(col_to_count))
        result = await pg_session.exec(statement)
        return result.one()

    return _count_rows


@pytest.fixture
def get_row(pg_session: AsyncSession):
    """
    Returns a coroutine that fetches a row by identifier from the given model.
    """

    async def _get_row(model, identifier, column=None):
        col_to_check = column if column else model.id
        statement = select(model).where(col_to_check == identifier)
        result = await pg_session.exec(statement)
        return result.first()

    return _get_row


@pytest.fixture
def create_track(
    pg_session,
) -> CreateTrack:
    return build_create_track(pg_session)


@pytest.fixture
async def track_1(
    create_track: CreateTrack,
    mp3_upload_file: UploadFile,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track mp3",
        recorded_date=date(2021, 2, 3),
        upload_file=mp3_upload_file,
    )
    return await create_track.execute(track_create_dto=track_create_dto)


@pytest.fixture
async def track_2(
    create_track: CreateTrack,
    ogg_upload_file: UploadFile,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track ogg",
        recorded_date=date(2021, 4, 5),
        upload_file=ogg_upload_file,
    )
    return await create_track.execute(track_create_dto=track_create_dto)


@pytest.fixture
async def track_3(
    create_track: CreateTrack,
    wav_upload_file: UploadFile,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track wav",
        recorded_date=date(2021, 6, 7),
        upload_file=wav_upload_file,
    )
    return await create_track.execute(track_create_dto=track_create_dto)


@pytest.fixture
def create_clip(
    pg_session,
) -> CreateClip:
    return build_create_clip(pg_session)


@pytest.fixture
async def clip_1(
    create_clip: CreateClip,
    track_1: TrackReadDto,
) -> ClipReadDto:
    clip_create_dto = ClipCreateDto(
        title="Test Clip 1",
        track_id=track_1.id,
        start=0,
        end=1000,
    )
    return await create_clip.execute(clip_create_dto)


@pytest.fixture
async def clip_2(
    create_clip: CreateClip,
    track_2: TrackReadDto,
) -> ClipReadDto:
    clip_create_dto = ClipCreateDto(
        title="Test Clip 2",
        track_id=track_2.id,
        start=500,
        end=1400,
    )
    return await create_clip.execute(clip_create_dto)
