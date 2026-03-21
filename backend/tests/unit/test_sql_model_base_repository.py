import uuid
from datetime import UTC, datetime
from typing import AsyncGenerator, Protocol

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.exceptions import DuplicateEntityError
from jamflow.models.base import BaseSQLModel
from jamflow.repositories.base import SQLModelBaseRepository

pytestmark = [pytest.mark.asyncio]


class DummyModel(BaseSQLModel, table=True):
    name: str


class DummyRepository(SQLModelBaseRepository[DummyModel]):
    model_class = DummyModel


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


@pytest.fixture
async def repo(sqli_session: AsyncSession) -> DummyRepository:
    return DummyRepository(sqli_session)


class DummyFactory(Protocol):
    def __call__(
        self,
        name: str,
        created_at: datetime | None = None,
        id: uuid.UUID | None = None,
    ) -> DummyModel: ...


@pytest.fixture
async def dummy_factory() -> DummyFactory:
    def _factory(
        name: str,
        created_at: datetime | None = None,
        id: uuid.UUID | None = None,
    ) -> DummyModel:
        dummy_id = id or uuid.uuid4()
        return DummyModel(
            id=dummy_id,
            name=name,
            created_at=created_at or datetime.now(UTC),
        )

    return _factory


async def test_create__adds_instance_and_flushes_session(
    repo: DummyRepository,
    dummy_factory: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = dummy_factory("Test Name")
    created = await repo.create(dummy)

    assert created.id == dummy.id
    assert created.name == dummy.name

    assert sqli_session.get(DummyModel, dummy.id) is not None


async def test_create__persists_after_commit(
    repo: DummyRepository,
    dummy_factory: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = dummy_factory("Persisted Dummy")
    await repo.create(dummy)
    await sqli_session.commit()

    persisted = await sqli_session.get(DummyModel, dummy.id)
    assert persisted is not None
    assert persisted.id == dummy.id


async def test_create__with_duplicate_instance_raises_exception(
    repo: DummyRepository,
    dummy_factory: DummyFactory,
):
    dummy_1 = dummy_factory("First dummy")
    persisted = await repo.create(dummy_1)
    dummy_2 = dummy_factory("Second dummy", id=persisted.id)

    with pytest.raises(DuplicateEntityError):
        await repo.create(dummy_2)


async def test_get_by_id__for_existing_instance_returns_the_correct_instance(
    repo: DummyRepository,
    dummy_factory: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = dummy_factory("Test Name")
    sqli_session.add(dummy)
    await sqli_session.commit()

    fetched = await repo.get_by_id(dummy.id)
    assert fetched is not None
    assert fetched.id == dummy.id
    assert fetched.name == dummy.name


async def test_get_by_id__for_non_existing_instance_returns_none(
    repo: DummyRepository,
):
    fetched = await repo.get_by_id(uuid.uuid4())
    assert fetched is None


async def test_list__returns_all_orderd_by_created_at(
    repo: DummyRepository,
    dummy_factory: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy_1 = dummy_factory("Name 1", created_at=datetime(2025, 10, 18))
    dummy_2 = dummy_factory("Name 2", created_at=datetime(2025, 10, 17))
    sqli_session.add_all([dummy_1, dummy_2])
    await sqli_session.commit()

    items = await repo.list()
    assert len(items) == 2
    assert items[0].created_at <= items[1].created_at


async def test_list__without_instances_returns_empty(
    repo: DummyRepository,
):
    items = await repo.list()
    assert len(items) == 0
