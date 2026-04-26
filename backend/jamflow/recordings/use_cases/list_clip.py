import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.recordings.protocols import AudioStorage, ClipRepository
from jamflow.recordings.schemas import ClipReadDto


class ListClip:
    def __init__(
        self,
        clip_repo: ClipRepository,
        session: AsyncSession,
        audio_storage: AudioStorage,
    ):
        self._clip_repo = clip_repo
        self._session = session
        self._audio_storage = audio_storage

    async def execute(self, track_id: uuid.UUID | None = None) -> list[ClipReadDto]:
        clips = await (
            self._clip_repo.list_all()
            if track_id is None
            else self._clip_repo.list_by_track_id(track_id=track_id)
        )
        async with self._audio_storage as audio_storage:
            clip_read_dtos = [
                ClipReadDto.model_validate(
                    dict(clip)
                    | {"url": await audio_storage.generate_expiring_url(clip.path)}
                )
                for clip in clips
            ]
        return clip_read_dtos
