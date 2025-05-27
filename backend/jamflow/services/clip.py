import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.log import get_logger
from jamflow.models.clip import Clip
from jamflow.models.track import Track
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.audio import clip_audio_file
from jamflow.services.exceptions import ResourceNotFoundException
from jamflow.services.storage import get_audio_storage_service
from jamflow.services.utils import generate_clip_path

log = get_logger()


async def clip_create(
    session: AsyncSession, *, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    track = await session.get(Track, clip_create_dto.track_id)
    if track is None:
        raise ResourceNotFoundException("Track")

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
        path = generate_clip_path(track.path, clip_id, clip_format.lower())

        await audio_storage.store_file(path=path, file=clip_file)
        await log.ainfo("File successfully stored", path=path)
        clip_url = await audio_storage.generate_expiring_url(path)

    clip = Clip.model_validate(
        clip_create_dto,
        update={
            "format": clip_format,
            "size": 0,  # TODO:  calculate size
            "path": path,
        },
    )

    session.add(clip)
    await session.commit()
    await log.ainfo("Clip successfully created", clip_id=clip.id)

    await session.refresh(clip)
    clip_read_dto = ClipReadDto.model_validate(dict(clip) | {"url": clip_url})

    return clip_read_dto
