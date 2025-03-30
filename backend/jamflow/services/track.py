import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from structlog import get_logger

from jamflow.models import Track
from jamflow.models.enums import AudioFileFormat
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.audio import get_audio_duration
from jamflow.services.storage import get_track_storage_service
from jamflow.utils import timezone_now

log = get_logger()


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    file_extension = Path(
        track_create_dto.upload_file.filename,  # type: ignore [arg-type]
    ).suffix.replace(".", "", count=1)
    file_path = _generate_file_path(file_extension)
    async with get_track_storage_service() as track_storage:
        await track_storage.store_file(
            path=file_path, file=track_create_dto.upload_file.file
        )
    await log.ainfo("File successfully stored", path=file_path)

    file_format = AudioFileFormat(file_extension.upper())
    duration = get_audio_duration(
        track_create_dto.upload_file.file,
        AudioFileFormat(file_extension.upper()),
    )

    track = Track.model_validate(
        track_create_dto,
        update={
            "duration": duration,
            "file_format": file_format,
            "file_size": track_create_dto.upload_file.size,
            "file_path": file_path,
        },
    )

    session.add(track)
    await session.commit()
    await log.ainfo("Track successfully created", track_id=track.id)

    await session.refresh(track)
    track_read_dto = TrackReadDto.model_validate(track)

    return track_read_dto


def _generate_file_path(extension: str) -> str:
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
