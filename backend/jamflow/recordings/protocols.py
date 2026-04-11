import uuid
from typing import Protocol, Sequence

from jamflow.core.protocols import Repository
from jamflow.recordings.models import Clip, Track


class TrackRepository(Repository[Track], Protocol): ...


class ClipRepository(Repository[Clip], Protocol):
    async def list_by_track_id(self, track_id: uuid.UUID) -> Sequence[Clip]: ...
