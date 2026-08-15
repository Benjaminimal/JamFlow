import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.recordings.protocols import AudioStorage, TrackRepository
from jamflow.recordings.schemas import TrackReadDto


class ReadTrack:
    def __init__(
        self,
        track_repo: TrackRepository,
        session: AsyncSession,
        audio_storage: AudioStorage,
    ):
        self._track_repo = track_repo
        self._session = session
        self._audio_storage = audio_storage

    async def execute(self, track_id: uuid.UUID) -> TrackReadDto:
        track = await self._track_repo.get_by_id(track_id)
        if track is None:
            raise ResourceNotFoundError("Track not found")
        async with self._audio_storage as audio_storage:
            track_url = await audio_storage.generate_expiring_url(track.path)
        track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})
        return track_read_dto
