from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.log import get_logger
from jamflow.models.clip import Clip
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.track import track_read

log = get_logger()


# TODO: clip the track and store the file
async def clip_create(
    session: AsyncSession, *, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    await track_read(session, track_id=clip_create_dto.track_id)

    clip = Clip.model_validate(clip_create_dto)

    session.add(clip)
    await session.commit()
    await log.ainfo("Clip successfully created", clip_id=clip.id)

    await session.refresh(clip)
    clip_read_dto = ClipReadDto.model_validate(clip)

    return clip_read_dto
