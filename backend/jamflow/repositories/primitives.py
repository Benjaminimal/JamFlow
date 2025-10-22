import uuid
from typing import Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .types import Model


async def get_by_id(
    model_class: type[Model],
    session: AsyncSession,
    model_id: uuid.UUID,
) -> Model | None:
    model = await session.get(model_class, model_id)
    return model


async def list(
    model_class: type[Model],
    session: AsyncSession,
) -> Sequence[Model]:
    statement = select(model_class)
    result = await session.exec(statement)
    return result.all()


async def create(
    session: AsyncSession,
    model: Model,
) -> Model:
    session.add(model)
    await session.flush()
    return model
