import pytest
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlmodel import col, func, select

from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.track import track_create


@pytest.fixture
def count_rows(db_session: AsyncSession):
    """
    Returns a coroutine that counts rows in the given model.
    """

    async def _count_rows(model, column=None):
        col_to_count = col(column) if column else col(model.id)
        statement = select(func.count(col_to_count))
        result = await db_session.exec(statement)
        return result.one()

    return _count_rows


@pytest.fixture
def get_row(db_session: AsyncSession):
    """
    Returns a coroutine that fetches a row by identifier from the given model.
    """

    async def _get_row(model, identifier, column=None):
        col_to_check = column if column else model.id
        statement = select(model).where(col_to_check == identifier)
        result = await db_session.exec(statement)
        return result.first()

    return _get_row


@pytest.fixture
async def track_1(
    db_session,
    audio_storage,  # noqa: ARG001
    mp3_upload_file,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track mp3",
        recorded_date="2021-02-03",
        upload_file=mp3_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_2(
    db_session,
    audio_storage,  # noqa: ARG001
    ogg_upload_file,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track ogg",
        recorded_date="2022-04-05",
        upload_file=ogg_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_3(
    db_session,
    audio_storage,  # noqa: ARG001
    wav_upload_file,
) -> TrackReadDto:
    track_create_dto = TrackCreateDto(
        title="Test Track wav",
        recorded_date="2023-06-07",
        upload_file=wav_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)
