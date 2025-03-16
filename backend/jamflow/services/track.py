import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.models import Track
from jamflow.models.enums import FileFormat
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.exceptions import ServiceException
from jamflow.services.storage import get_track_storage_service
from jamflow.utils import timezone_now

MAX_FILE_SIZE = 200 * 1024 * 1024  # 200 MB


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    # TODO: ensure non empty string in the dto
    # TODO: find out how to strip whitespace in the dto
    if track_create_dto.title.strip() == "":
        raise ServiceException("Title is empty")

    file_size = track_create_dto.upload_file.size
    if not file_size:
        raise ServiceException("File is empty")

    if file_size > MAX_FILE_SIZE:
        raise ServiceException(
            f"File size exceeds the maximum limit of {MAX_FILE_SIZE / (1024 * 1024)} MB"
        )

    if not track_create_dto.upload_file.filename:
        raise ServiceException("File name is empty")

    # TODO: look at the actual file to find the file format
    file_extension = Path(track_create_dto.upload_file.filename).suffix.replace(
        ".", "", count=1
    )
    file_format = file_extension.upper()
    if file_format not in FileFormat:
        raise ServiceException(
            f"File format not in allowed formats: {', '.join(FileFormat)}"
        )

    file_path = _generate_file_path(file_extension)
    async with get_track_storage_service() as track_storage:
        # TODO: not sure how to handle storage exceptions here
        await track_storage.store_file(
            path=file_path, file=track_create_dto.upload_file.file
        )

    track = Track.model_validate(
        track_create_dto,
        update={
            "duration": 123,  # TODO: find out duration (use pydub, mutagen,...)
            "file_format": FileFormat(file_format),
            "file_size": file_size,
            "file_path": file_path,
        },
    )

    session.add(track)
    await session.commit()
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
