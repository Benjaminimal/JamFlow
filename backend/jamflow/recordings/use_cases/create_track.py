import uuid

from sqlmodel.ext.asyncio.session import AsyncSession
from structlog import get_logger

from jamflow.recordings.models import Track
from jamflow.recordings.protocols import AudioProcessor, AudioStorage, TrackRepository
from jamflow.recordings.schemas import TrackCreateDto, TrackReadDto
from jamflow.recordings.utils import generate_track_path

logger = get_logger()


class CreateTrack:
    def __init__(
        self,
        *,
        track_repo: TrackRepository,
        session: AsyncSession,
        audio_processor: AudioProcessor,
        audio_storage: AudioStorage,
    ):
        self._track_repo = track_repo
        self._session = session
        self._audio_processor = audio_processor
        self._audio_storage = audio_storage

    async def execute(self, track_create_dto: TrackCreateDto) -> TrackReadDto:
        format = self._audio_processor.get_format(track_create_dto.upload_file.file)
        content_type = format.mime_type

        track_id = uuid.uuid4()
        path = generate_track_path(track_id, format)
        async with self._audio_storage as audio_storage:
            await audio_storage.store_file(
                file=track_create_dto.upload_file.file,
                path=path,
                content_type=content_type,
            )
            await logger.ainfo("File stored", path=path)
            track_url = await audio_storage.generate_expiring_url(path)

        track_create_dto.upload_file.file.seek(0)
        duration = self._audio_processor.get_duration(
            track_create_dto.upload_file.file, format
        )

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

        track = await self._track_repo.create(track)
        await self._session.commit()
        await logger.ainfo("Track created", track_id=track.id)

        await self._session.refresh(track)
        track_read_dto = TrackReadDto.model_validate(dict(track) | {"url": track_url})

        return track_read_dto
