import uuid
from typing import (
    Protocol,
    Sequence,
    TypeVar,
)

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.models.base import BaseSQLModel
from jamflow.models.track import Track

Model = TypeVar("Model", bound=BaseSQLModel)


class Repository[Model](Protocol):
    async def get_by_id(
        self, session: AsyncSession, model_id: uuid.UUID
    ) -> Model | None: ...

    async def list(self, session: AsyncSession) -> Sequence[Model]: ...

    async def create(self, session: AsyncSession, model: Model) -> Model: ...


TrackRepository = Repository[Track]
