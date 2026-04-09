import uuid
import warnings
from datetime import UTC, datetime
from typing import Protocol

import pytest
from sqlalchemy.exc import SAWarning
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.exceptions import DuplicateEntityError
from jamflow.core.repositories import SQLModelBaseRepository
from jamflow.infra.models import BaseSQLModel

pytestmark = [pytest.mark.asyncio]


class DummyModel(BaseSQLModel, table=True):
    name: str


class DummyRepository(SQLModelBaseRepository[DummyModel]):
    model_class = DummyModel


class DummyFactory(Protocol):
    def __call__(
        self,
        name: str,
        created_at: datetime | None = None,
        id: uuid.UUID | None = None,
    ) -> DummyModel: ...


@pytest.fixture
async def make_dummy() -> DummyFactory:
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


@pytest.fixture
async def repo(sqli_session: AsyncSession) -> DummyRepository:
    return DummyRepository(sqli_session)


async def test_create__adds_instance_and_flushes_session(
    repo: DummyRepository,
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = make_dummy("Test Name")
    created = await repo.create(dummy)

    assert created.id == dummy.id
    assert created.name == dummy.name

    persisted = await sqli_session.get(DummyModel, dummy.id)
    assert persisted is not None


async def test_create__persists_after_commit(
    repo: DummyRepository,
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = make_dummy("Persisted Dummy")
    await repo.create(dummy)
    await sqli_session.commit()

    persisted = await sqli_session.get(DummyModel, dummy.id)
    assert persisted is not None
    assert persisted.id == dummy.id


async def test_create__with_duplicate_instance_raises_exception(
    repo: DummyRepository,
    make_dummy: DummyFactory,
):
    dummy_1 = make_dummy("First dummy")
    persisted = await repo.create(dummy_1)
    dummy_2 = make_dummy("Second dummy", id=persisted.id)

    with (
        warnings.catch_warnings(),
        pytest.raises(DuplicateEntityError),
    ):
        warnings.filterwarnings(
            "ignore",
            category=SAWarning,
            message=".*conflicts with persistent instance.*",
        )
        await repo.create(dummy_2)


async def test_get_by_id__for_existing_instance_returns_the_correct_instance(
    repo: DummyRepository,
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy = make_dummy("Test Name")
    sqli_session.add(dummy)
    await sqli_session.flush()

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
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy_1 = make_dummy("Name 1", created_at=datetime(2025, 10, 18))
    dummy_2 = make_dummy("Name 2", created_at=datetime(2025, 10, 17))
    sqli_session.add_all([dummy_1, dummy_2])
    await sqli_session.flush()

    items = await repo.list_all()
    assert len(items) == 2
    assert items[0].created_at <= items[1].created_at


async def test_list__without_instances_returns_empty(
    repo: DummyRepository,
):
    items = await repo.list_all()
    assert len(items) == 0


async def test_list_by_ids__without_ids_returns_empty(
    repo: DummyRepository,
):
    items = await repo.list_by_ids([])
    assert len(items) == 0


async def test_list_by_ids__returns_correct_objects(
    repo: DummyRepository,
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy_1 = make_dummy("Dummy 1")
    dummy_2 = make_dummy("Dummy 2")
    dummy_3 = make_dummy("Dummy 3")
    sqli_session.add(dummy_1)
    sqli_session.add(dummy_2)
    sqli_session.add(dummy_3)
    await sqli_session.flush()

    items = await repo.list_by_ids([dummy_1.id, dummy_2.id])
    assert len(items) == 2
    items_ids = [i.id for i in items]
    assert dummy_1.id in items_ids
    assert dummy_2.id in items_ids


async def test_list_by_ids__orders_by_created_at_desc(
    repo: DummyRepository,
    make_dummy: DummyFactory,
    sqli_session: AsyncSession,
):
    dummy_1 = make_dummy("Name 1", created_at=datetime(2025, 10, 18))
    dummy_2 = make_dummy("Name 2", created_at=datetime(2025, 10, 17))
    sqli_session.add(dummy_1)
    sqli_session.add(dummy_2)
    await sqli_session.flush()

    items = await repo.list_by_ids([dummy_1.id, dummy_2.id])
    assert items[0].created_at < items[1].created_at
