import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.database import get_session
from jamflow.main import app


@pytest.fixture
async def simple_client() -> AsyncClient:
    """
    Fixture to create an ASGI test client.
    """
    async with AsyncClient(
        transport=ASGITransport(app),
        base_url="http://test",
    ) as c:
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


@pytest.fixture
async def public_client() -> AsyncClient:
    """
    Fixture to create an general purpose test client without a base URL.
    """
    async with AsyncClient() as c:
        yield c
