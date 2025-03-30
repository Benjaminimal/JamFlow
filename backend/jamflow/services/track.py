import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from structlog import get_logger

from jamflow.models import Track
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.audio import (
    AudioServiceException,
    get_audio_duration,
    get_audio_file_format,
)
from jamflow.services.exceptions import ValidationException
from jamflow.services.storage import get_track_storage_service
from jamflow.utils import timezone_now

log = get_logger()


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    format = get_audio_file_format(track_create_dto.upload_file.file)

    path = _generate_path(format.lower())
    async with get_track_storage_service() as track_storage:
        await track_storage.store_file(
            path=path, file=track_create_dto.upload_file.file
        )
    await log.ainfo("File successfully stored", path=path)

    try:
        duration = get_audio_duration(track_create_dto.upload_file.file, format)
    except AudioServiceException as exc:
        raise ValidationException(
            "Failed to get audio duration", field="upload_file"
        ) from exc

    track = Track.model_validate(
        track_create_dto,
        update={
            "duration": duration,
            "format": format,
            "size": track_create_dto.upload_file.size,
            "path": path,
        },
    )

    session.add(track)
    await session.commit()
    await log.ainfo("Track successfully created", track_id=track.id)

    await session.refresh(track)
    track_read_dto = TrackReadDto.model_validate(track)

    return track_read_dto


def _generate_path(extension: str) -> str:
    now = timezone_now()

    timestamp = now.strftime("%Y%m%d%H%M%S")
    file_name = f"{timestamp}_{uuid.uuid4().hex}.{extension}"

    path = "/".join(
        (
            now.strftime("%Y"),
            now.strftime("%m"),
            file_name,
        )
    )

    return path
