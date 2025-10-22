import uuid
from datetime import timedelta

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession
from structlog import get_logger

from jamflow.core.exceptions import ResourceNotFoundError
from jamflow.models import Track
from jamflow.repositories import track_repository
from jamflow.schemas.track import TrackCreateDto, TrackReadDto, TrackSignedUrlDto
from jamflow.services.audio import (
    get_audio_duration,
    get_audio_file_format,
    get_audio_mime_type,
)
from jamflow.services.storage import get_audio_storage_service
from jamflow.services.utils import generate_track_path
from jamflow.utils import timezone_now

logger = get_logger()


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    format = get_audio_file_format(track_create_dto.upload_file.file)
    content_type = get_audio_mime_type(format)

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

    track = await track_repository.create(session, model=track)
    await session.commit()
    await logger.ainfo("Track created", track_id=track.id)

    await session.refresh(track)
    track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})

    return track_read_dto


async def track_list(session: AsyncSession) -> list[TrackReadDto]:
    tracks = await track_repository.list(session)
    async with get_audio_storage_service() as audio_storage:
        track_read_dtos = [
            TrackReadDto.model_validate(
                dict(track)
                | {"url": await audio_storage.generate_expiring_url(track.path)}
            )
            for track in tracks
        ]
    return track_read_dtos


async def track_read(session: AsyncSession, *, track_id: uuid.UUID) -> TrackReadDto:
    track = await track_repository.get_by_id(session, id=track_id)
    if track is None:
        raise ResourceNotFoundError("Track not found")
    async with get_audio_storage_service() as audio_storage:
        track_url = await audio_storage.generate_expiring_url(track.path)
    track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})
    return track_read_dto


# TODO: replace with repository method or get rid of the entire endpoint
async def track_generate_signed_urls(
    session: AsyncSession,
    *,
    track_ids: list[uuid.UUID],
) -> list[TrackSignedUrlDto]:
    statement = select(Track).where(col(Track.id).in_(track_ids))
    result = await session.exec(statement)
    tracks = result.all()
    expires_at = timezone_now() + timedelta(hours=1)
    async with get_audio_storage_service() as audio_storage:
        track_url_data = [
            {
                "track_id": track.id,
                "url": await audio_storage.generate_expiring_url(track.path),
                "expires_at": expires_at,
            }
            for track in tracks
        ]
    return [TrackSignedUrlDto.model_validate(t_url) for t_url in track_url_data]
