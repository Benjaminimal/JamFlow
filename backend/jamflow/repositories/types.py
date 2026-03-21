import uuid
from typing import Protocol, Sequence


class Repository[M](Protocol):
    async def create(self, model: M) -> M:
        """
        Persist a model instance for the first time.
        :raises core.exceptions.DuplicateEntityError: if the instance was previously persisted.
        """
        ...

    async def get_by_id(self, id: uuid.UUID) -> M | None: ...
    async def list(self) -> Sequence[M]: ...
