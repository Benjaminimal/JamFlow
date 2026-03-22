from typing import AsyncGenerator

import pytest
from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession


@pytest.fixture
def mock_db_session(mocker: MockerFixture):
    """
    A fake database session for tests that don't touch the database.
    """
    session = mocker.AsyncMock()
    session.add = mocker.Mock()  # Explicitly mock `add` as a synchronous method
    return session


@pytest.fixture
async def sqli_engine() -> AsyncGenerator[AsyncEngine]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def sqli_session(
    sqli_engine: AsyncEngine,
) -> AsyncGenerator[AsyncSession]:
    async_session = AsyncSession(sqli_engine, expire_on_commit=False)
    yield async_session
    await async_session.close()
