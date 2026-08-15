import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.recordings.protocols import AudioStorage, ClipRepository
from jamflow.recordings.schemas import ClipReadDto


class ReadClip:
    def __init__(
        self,
        clip_repo: ClipRepository,
        session: AsyncSession,
        audio_storage: AudioStorage,
    ):
        self._clip_repo = clip_repo
        self._session = session
        self._audio_storage = audio_storage

    async def execute(self, clip_id: uuid.UUID) -> ClipReadDto:
        clip = await self._clip_repo.get_by_id(clip_id)
        if clip is None:
            raise ResourceNotFoundError("Clip not found")

        async with self._audio_storage as audio_storage:
            clip_url = await audio_storage.generate_expiring_url(clip.path)

        clip_read_dto = ClipReadDto.model_validate(dict(clip) | {"url": clip_url})

        return clip_read_dto
