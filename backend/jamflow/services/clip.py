from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.log import get_logger
from jamflow.models.clip import Clip
from jamflow.models.track import Track
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.audio import clip_audio_file
from jamflow.services.exceptions import ResourceNotFoundException
from jamflow.services.storage import get_clip_storage_service, get_track_storage_service
from jamflow.services.utils import generate_file_path

log = get_logger()


# TODO: clip the track and store the file
async def clip_create(
    session: AsyncSession, *, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    track = await session.get(Track, clip_create_dto.track_id)
    if track is None:
        raise ResourceNotFoundException("Track")

    async with get_track_storage_service() as track_storage:
        track_file = await track_storage.get_file(track.path)

    clip_file = clip_audio_file(
        track_file,
        track.format,
        start=clip_create_dto.start,
        end=clip_create_dto.end,
    )
    clip_format = track.format
    path = generate_file_path(clip_format.lower())

    async with get_clip_storage_service() as clip_storage:
        await clip_storage.store_file(path=path, file=clip_file)
        await log.ainfo("File successfully stored", path=path)
        clip_url = await clip_storage.generate_expiring_url(path)

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
