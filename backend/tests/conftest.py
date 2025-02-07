import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from jamflow.core.db import engine, session_factory
from jamflow.main import app


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create tables and drop them after tests."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def session():
    """
    Create a new connection and transaction for each test.
    This ensures that the session has its own dedicated connection.
    """
    async with engine.connect() as connection:
        # Begin a non-ORM transaction on this connection
        transaction = await connection.begin()
        # Bind a session to this connection
        async with session_factory(bind=connection) as session:
            try:
                yield session
            finally:
                # Roll back the transaction so that changes are not committed
                await transaction.rollback()


@pytest.fixture
def client():
    with TestClient(
        app=app,
        # TODO: use the correct base url
        # base_url=f"http://{settings.api_v1_prefix}"
    ) as client:
        yield client
