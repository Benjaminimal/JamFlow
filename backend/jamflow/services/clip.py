import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.exceptions import ResourceNotFoundError, ValidationError
from jamflow.core.log import get_logger
from jamflow.models.clip import Clip
from jamflow.models.track import Track
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.audio import (
    clip_audio_file,
    get_audio_mime_type,
    get_file_size,
)
from jamflow.services.storage import get_audio_storage_service
from jamflow.services.utils import generate_clip_path

logger = get_logger()


async def clip_create(
    session: AsyncSession, *, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    track = await session.get(Track, clip_create_dto.track_id)
    if track is None:
        raise ResourceNotFoundError("Track not found")

    if track.duration < clip_create_dto.end:
        raise ValidationError("Clip end time exceeds track duration")

    clip_id = uuid.uuid4()
    async with get_audio_storage_service() as audio_storage:
        track_file = await audio_storage.get_file(track.path)

        clip_file = clip_audio_file(
            track_file,
            track.format,
            start=clip_create_dto.start,
            end=clip_create_dto.end,
        )
        clip_format = track.format
        path = generate_clip_path(track.path, clip_id, clip_format)
        content_type = get_audio_mime_type(clip_format)

        await audio_storage.store_file(
            file=clip_file,
            path=path,
            content_type=content_type,
        )
        await logger.ainfo("File stored", path=path)
        clip_url = await audio_storage.generate_expiring_url(path)

    clip_size = get_file_size(clip_file)

    clip = Clip.model_validate(
        clip_create_dto,
        update={
            "format": clip_format,
            "size": clip_size,
            "path": path,
            "duration": clip_create_dto.end - clip_create_dto.start,
        },
    )

    session.add(clip)
    await session.commit()
    await logger.ainfo("Clip created", clip_id=clip.id)

    await session.refresh(clip)
    clip_read_dto = ClipReadDto.model_validate(dict(clip) | {"url": clip_url})

    return clip_read_dto


async def clip_list(
    session: AsyncSession,
    track_id: uuid.UUID | None = None,
) -> list[ClipReadDto]:
    statement = select(Clip)
    if track_id is not None:
        statement = statement.where(Clip.track_id == track_id)
    result = await session.exec(statement)
    clips = result.all()
    async with get_audio_storage_service() as audio_storage:
        clip_read_dtos = [
            ClipReadDto.model_validate(
                dict(clip)
                | {"url": await audio_storage.generate_expiring_url(clip.path)}
            )
            for clip in clips
        ]
    return clip_read_dtos


async def clip_read(
    session: AsyncSession,
    clip_id: uuid.UUID,
) -> ClipReadDto:
    clip = await session.get(Clip, clip_id)
    if clip is None:
        raise ResourceNotFoundError("Clip not found")

    async with get_audio_storage_service() as audio_storage:
        clip_url = await audio_storage.generate_expiring_url(clip.path)

    clip_read_dto = ClipReadDto.model_validate(dict(clip) | {"url": clip_url})

    return clip_read_dto
