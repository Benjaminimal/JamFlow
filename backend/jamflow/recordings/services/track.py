import uuid

from sqlmodel.ext.asyncio.session import AsyncSession
from structlog import get_logger

from jamflow.infra.audio import get_audio_duration, get_audio_file_format
from jamflow.infra.database.repositories import SQLModelTrackRepository
from jamflow.infra.storage import get_audio_storage_service
from jamflow.recordings.models import Track
from jamflow.recordings.schemas import TrackCreateDto, TrackReadDto
from jamflow.recordings.utils import generate_track_path

logger = get_logger()


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    format = get_audio_file_format(track_create_dto.upload_file.file)
    content_type = format.mime_type

    track_id = uuid.uuid4()
    path = generate_track_path(track_id, format)
    async with get_audio_storage_service() as audio_storage:
        await audio_storage.store_file(
            file=track_create_dto.upload_file.file,
            path=path,
            content_type=content_type,
        )
        await logger.ainfo("File stored", path=path)
        track_url = await audio_storage.generate_expiring_url(path)

    track_create_dto.upload_file.file.seek(0)
    duration = get_audio_duration(track_create_dto.upload_file.file, format)

    track = Track.model_validate(
        track_create_dto,
        update={
            "id": track_id,
            "duration": duration,
            "format": format,
            "size": track_create_dto.upload_file.size,
            "path": path,
        },
    )

    track_repo = SQLModelTrackRepository(session)
    track = await track_repo.create(track)
    await session.commit()
    await logger.ainfo("Track created", track_id=track.id)

    await session.refresh(track)
    track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})

    return track_read_dto


async def track_list(session: AsyncSession) -> list[TrackReadDto]:
    track_repo = SQLModelTrackRepository(session)
    tracks = await track_repo.list_all()
    async with get_audio_storage_service() as audio_storage:
        track_read_dtos = [
            TrackReadDto.model_validate(
                dict(track)
                | {"url": await audio_storage.generate_expiring_url(track.path)}
            )
            for track in tracks
        ]
    return track_read_dtos
