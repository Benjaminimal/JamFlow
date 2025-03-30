import pytest
import pytest_asyncio
from sqlalchemy import NullPool, text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.config import settings

TEST_DB_NAME = f"{settings.DB_NAME}_test"
TEST_DB_URI = TEST_DB_NAME.join(
    str(settings.SQLALCHEMY_DATABASE_URI).rsplit(settings.DB_NAME, 1)
)


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def db_engine():
    """
    Set up and tear down a fresh test database including tables for the entire test session.
    """
    # Create a fresh test database
    root_engine = create_async_engine(
        str(settings.SQLALCHEMY_DATABASE_ROOT_URI), isolation_level="AUTOCOMMIT"
    )
    async with root_engine.connect() as conn:
        await conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
        await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))

    # Provide an engine with a NullPool to avoid connection pooling issues
    engine = create_async_engine(
        TEST_DB_URI,
        future=True,
        poolclass=NullPool,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    # Drop the test database
    async with root_engine.connect() as conn:
        await conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))

    # Dispose of resources
    await engine.dispose()
    await root_engine.dispose()


@pytest.fixture
async def db_session(db_engine: AsyncEngine):
    """
    Create a new connection and transaction for each test.
    This ensures that the session has its own dedicated connection.
    """
    async with db_engine.connect() as conn:
        # Begin a non-ORM transaction on this connection
        transaction = await conn.begin()
        # Bind a session to this connection
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            try:
                yield session
            finally:
                # Roll back the transaction so that changes are not committed
                await transaction.rollback()
