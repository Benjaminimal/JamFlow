import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.core.exceptions import ResourceNotFoundError, ValidationError
from jamflow.core.log import get_logger
from jamflow.recordings.models import Clip
from jamflow.recordings.protocols import (
    AudioProcessor,
    AudioStorage,
    ClipRepository,
    TrackRepository,
)
from jamflow.recordings.schemas import ClipCreateDto, ClipReadDto
from jamflow.recordings.utils import generate_clip_path

logger = get_logger()


class CreateClip:
    def __init__(
        self,
        *,
        clip_repo: ClipRepository,
        track_repo: TrackRepository,
        session: AsyncSession,
        audio_processor: AudioProcessor,
        audio_storage: AudioStorage,
    ):
        self._clip_repo = clip_repo
        self._track_repo = track_repo
        self._session = session
        self._audio_processor = audio_processor
        self._audio_storage = audio_storage

    async def execute(self, clip_create_dto: ClipCreateDto) -> ClipReadDto:
        track = await self._track_repo.get_by_id(clip_create_dto.track_id)
        if track is None:
            raise ResourceNotFoundError("Track not found")

        # TODO: consider how this can be moved into the domain
        if track.duration < clip_create_dto.end:
            raise ValidationError("Clip end time exceeds track duration")

        clip_id = uuid.uuid4()
        async with self._audio_storage as audio_storage:
            track_file = await audio_storage.get_file(track.path)

            clip_file = self._audio_processor.clip(
                track_file,
                track.format,
                start=clip_create_dto.start,
                end=clip_create_dto.end,
            )
            clip_format = track.format
            path = generate_clip_path(track.path, clip_id, clip_format)
            content_type = self._audio_processor.get_mime_type(clip_format)

            await audio_storage.store_file(
                file=clip_file,
                path=path,
                content_type=content_type,
            )
            await logger.ainfo("File stored", path=path)
            clip_url = await audio_storage.generate_expiring_url(path)

        clip_size = self._audio_processor.get_size(clip_file)

        clip = Clip.model_validate(
            clip_create_dto,
            update={
                "id": clip_id,
                "format": clip_format,
                "size": clip_size,
                "path": path,
                "duration": clip_create_dto.end - clip_create_dto.start,
            },
        )

        clip = await self._clip_repo.create(clip)
        await self._session.commit()
        await logger.ainfo("Clip created", clip_id=clip.id)

        await self._session.refresh(clip)
        clip_read_dto = ClipReadDto.model_validate(dict(clip) | {"url": clip_url})

        return clip_read_dto
