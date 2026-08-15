from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.recordings.protocols import AudioStorage, TrackRepository
from jamflow.recordings.schemas import TrackReadDto


class ListTrack:
    def __init__(
        self,
        track_repo: TrackRepository,
        session: AsyncSession,
        audio_storage: AudioStorage,
    ):
        self._track_repo = track_repo
        self._session = session
        self._audio_storage = audio_storage

    async def execute(self) -> list[TrackReadDto]:
        tracks = await self._track_repo.list_all()
        async with self._audio_storage as audio_storage:
            track_read_dtos = [
                TrackReadDto.model_validate(
                    dict(track)
                    | {"url": await audio_storage.generate_expiring_url(track.path)}
                )
                for track in tracks
            ]
        return track_read_dtos
