import uuid
from typing import Sequence

from sqlmodel import col, select

from jamflow.recordings.models import Clip

from .base import SQLModelBaseRepository


class SQLModelClipRepository(SQLModelBaseRepository[Clip]):
    model_class = Clip

    async def list_by_track_id(self, track_id: uuid.UUID) -> Sequence[Clip]:
        statement = (
            select(Clip)
            .where(Clip.track_id == track_id)
            .order_by(col(Clip.created_at).desc())
        )
        result = await self._session.exec(statement)
        return result.all()
