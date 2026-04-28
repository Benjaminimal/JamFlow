from typing import AsyncGenerator
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from tests.unit.fakes import (
    FakeAudioProcessor,
    FakeAudioStorage,
    FakeClipRepository,
    FakeTrackRepository,
)


@pytest.fixture
def mock_db_session(mocker: MockerFixture) -> AsyncMock:
    """A fake database session for tests that don't touch the database."""
    session = mocker.AsyncMock()
    session.add = mocker.Mock()  # Explicitly mock `add` as a synchronous method
    return session


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def sqli_engine() -> AsyncGenerator[AsyncEngine]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True, future=True)

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def sqli_session(
    sqli_engine: AsyncEngine,
) -> AsyncGenerator[AsyncSession]:
    """Create a new connection and transaction for each test.
    This ensures that tests using the database are isolated and the session has its own dedicated connection.
    """
    async with sqli_engine.connect() as conn:
        transaction = await conn.begin()
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            try:
                yield session
            finally:
                await transaction.rollback()


@pytest.fixture
def fake_clip_repo() -> FakeClipRepository:
    return FakeClipRepository()


@pytest.fixture
def fake_track_repo() -> FakeTrackRepository:
    return FakeTrackRepository()


@pytest.fixture
def fake_audio_storage() -> FakeAudioStorage:
    return FakeAudioStorage()


@pytest.fixture
def fake_audio_processor() -> FakeAudioProcessor:
    return FakeAudioProcessor()
