import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.database import get_session
from jamflow.main import app
from jamflow.schemas.track import TrackCreateDto
from jamflow.services.track import track_create


@pytest.fixture
async def simple_client() -> AsyncClient:
    """
    Fixture to create an ASGI test client.
    """
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def client(simple_client: AsyncClient, db_session: AsyncSession) -> AsyncClient:
    """
    Fixture to create an ASGI test client with a database session dependency override.
    """

    def override_get_session():
        return db_session

    app.dependency_overrides[get_session] = override_get_session
    yield simple_client
    app.dependency_overrides.clear()


# TODO: return type is wrong
@pytest.fixture
async def track_1(db_session, track_storage, mp3_upload_file) -> TrackCreateDto:
    track_create_dto = TrackCreateDto(
        title="Test Track mp3",
        recorded_date="2021-02-03",
        upload_file=mp3_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_2(db_session, track_storage, ogg_upload_file) -> TrackCreateDto:
    track_create_dto = TrackCreateDto(
        title="Test Track ogg",
        recorded_date="2022-04-05",
        upload_file=ogg_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_3(db_session, track_storage, wav_upload_file) -> TrackCreateDto:
    track_create_dto = TrackCreateDto(
        title="Test Track wav",
        recorded_date="2023-06-07",
        upload_file=wav_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)
