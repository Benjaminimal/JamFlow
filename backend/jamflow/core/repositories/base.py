import uuid
from typing import Sequence

from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.exceptions import DuplicateEntityError
from jamflow.core.models import BaseSQLModel


class SQLModelBaseRepository[M: BaseSQLModel]:
    _session: AsyncSession
    model_class: type[M]

    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, model: M) -> M:
        self._session.add(model)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            raise DuplicateEntityError(
                "Unable to create model",
                context={
                    "model_class": self.model_class,
                    "model_id": model.id,
                },
            ) from exc
        return model

    async def get_by_id(self, id: uuid.UUID) -> M | None:
        model = await self._session.get(self.model_class, id)
        return model

    async def list_all(self) -> Sequence[M]:
        statement = select(self.model_class).order_by(col(self.model_class.created_at))
        result = await self._session.exec(statement)
        return result.all()

    async def list_by_ids(self, ids: list[uuid.UUID]) -> Sequence[M]:
        statement = (
            select(self.model_class)
            .where(col(self.model_class.id).in_(ids))
            .order_by(col(self.model_class.created_at))
        )
        result = await self._session.exec(statement)
        return result.all()
