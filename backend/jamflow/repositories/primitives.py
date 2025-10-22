import uuid
from typing import Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .types import Filters, FiltersHook, Model


async def get_by_id(
    session: AsyncSession,
    *,
    model_class: type[Model],
    id: uuid.UUID,
) -> Model | None:
    model = await session.get(model_class, id)
    return model


async def list(
    session: AsyncSession,
    *,
    model_class: type[Model],
    filters: Filters | None = None,
    filters_hook: FiltersHook | None = None,
) -> Sequence[Model]:
    statement = select(model_class)
    if filters_hook is not None and filters is not None:
        statement = filters_hook(statement, filters)
    result = await session.exec(statement)
    return result.all()


async def create(
    session: AsyncSession,
    *,
    model: Model,
) -> Model:
    session.add(model)
    await session.flush()
    return model
