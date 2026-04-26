from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.config import settings
from jamflow.infra.audio import native_audio_processor as default_audio_processor
from jamflow.infra.database.repositories import (
    SQLModelClipRepository,
    SQLModelTrackRepository,
)
from jamflow.infra.storage.s3 import S3StorageService
from jamflow.recordings.protocols import (
    AudioProcessor,
    AudioStorage,
    ClipRepository,
    TrackRepository,
)
from jamflow.recordings.use_cases import (
    CreateClip,
    CreateTrack,
    ListClip,
    ListTrack,
    ReadClip,
    ReadTrack,
)


def _default_clip_repo(session: AsyncSession) -> ClipRepository:
    return SQLModelClipRepository(session)


def _default_track_repo(session: AsyncSession) -> TrackRepository:
    return SQLModelTrackRepository(session)


def _default_audio_storage() -> AudioStorage:
    return S3StorageService(settings.STORAGE_NAME_AUDIO)


def _default_audio_processor() -> AudioProcessor:
    return default_audio_processor


def build_create_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_processor: AudioProcessor | None = None,
    audio_storage: AudioStorage | None = None,
) -> CreateTrack:
    return CreateTrack(
        session=session,
        track_repo=track_repo or _default_track_repo(session),
        audio_processor=audio_processor or _default_audio_processor(),
        audio_storage=audio_storage or _default_audio_storage(),
    )


def build_read_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ReadTrack:
    return ReadTrack(
        session=session,
        track_repo=track_repo or _default_track_repo(session),
        audio_storage=audio_storage or _default_audio_storage(),
    )


def build_list_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ListTrack:
    return ListTrack(
        session=session,
        track_repo=track_repo or _default_track_repo(session),
        audio_storage=audio_storage or _default_audio_storage(),
    )


def build_list_clip(
    session: AsyncSession,
    clip_repo: ClipRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ListClip:
    return ListClip(
        session=session,
        clip_repo=clip_repo or _default_clip_repo(session),
        audio_storage=audio_storage or _default_audio_storage(),
    )


def build_read_clip(
    session: AsyncSession,
    clip_repo: ClipRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ReadClip:
    return ReadClip(
        session=session,
        clip_repo=clip_repo or _default_clip_repo(session),
        audio_storage=audio_storage or _default_audio_storage(),
    )


def build_create_clip(
    session: AsyncSession,
    clip_repo: ClipRepository | None = None,
    track_repo: TrackRepository | None = None,
    audio_processor: AudioProcessor | None = None,
    audio_storage: AudioStorage | None = None,
) -> CreateClip:
    return CreateClip(
        session=session,
        clip_repo=clip_repo or _default_clip_repo(session),
        track_repo=track_repo or _default_track_repo(session),
        audio_processor=audio_processor or _default_audio_processor(),
        audio_storage=audio_storage or _default_audio_storage(),
    )
