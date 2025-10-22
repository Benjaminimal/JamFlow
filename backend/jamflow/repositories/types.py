import uuid
from typing import (
    Callable,
    Protocol,
    Sequence,
    TypeVar,
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel.sql.expression import SelectOfScalar

from jamflow.models.base import BaseSQLModel
from jamflow.models.clip import Clip
from jamflow.models.track import Track

Model = TypeVar("Model", bound=BaseSQLModel)
Filters = TypeVar("Filters")

FiltersHook = Callable[[SelectOfScalar[Model], Filters], SelectOfScalar[Model]]


class Repository[Model](Protocol):
    async def get_by_id(
        self, session: AsyncSession, model_id: uuid.UUID
    ) -> Model | None: ...

    async def list(
        self, session: AsyncSession, filters: Filters | None = None
    ) -> Sequence[Model]: ...

    async def create(self, session: AsyncSession, model: Model) -> Model: ...


TrackRepository = Repository[Track]

ClipRepository = Repository[Clip]
