import uuid
from datetime import timedelta

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession
from structlog import get_logger

from jamflow.models import Track
from jamflow.schemas.track import TrackCreateDto, TrackReadDto, TrackSignedUrlDto
from jamflow.services.audio import (
    AudioServiceException,
    get_audio_duration,
    get_audio_file_format,
)
from jamflow.services.exceptions import ResourceNotFoundException, ValidationException
from jamflow.services.storage import get_audio_storage_service
from jamflow.services.utils import generate_track_path
from jamflow.utils import timezone_now

log = get_logger()


async def track_create(
    session: AsyncSession,
    *,
    track_create_dto: TrackCreateDto,
) -> TrackReadDto:
    format = get_audio_file_format(track_create_dto.upload_file.file)

    track_id = uuid.uuid4()
    path = generate_track_path(track_id, format)
    async with get_audio_storage_service() as audio_storage:
        await audio_storage.store_file(
            file=track_create_dto.upload_file.file, path=path
        )
        await log.ainfo("File successfully stored", path=path)
        track_url = await audio_storage.generate_expiring_url(path)

    track_create_dto.upload_file.file.seek(0)
    try:
        duration = get_audio_duration(track_create_dto.upload_file.file, format)
    except AudioServiceException as exc:
        raise ValidationException(
            "Failed to get audio duration", field="upload_file"
        ) from exc

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

    session.add(track)
    await session.commit()
    await log.ainfo("Track successfully created", track_id=track.id)

    await session.refresh(track)
    track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})

    return track_read_dto


async def track_list(session: AsyncSession) -> list[TrackReadDto]:
    result = await session.exec(select(Track))
    tracks = result.all()
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
    track = await session.get(Track, track_id)
    if track is None:
        raise ResourceNotFoundException("Track")
    async with get_audio_storage_service() as audio_storage:
        track_url = await audio_storage.generate_expiring_url(track.path)
    track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})
    return track_read_dto


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
