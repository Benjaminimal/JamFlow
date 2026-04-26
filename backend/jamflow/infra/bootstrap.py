from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.config import settings
from jamflow.infra.audio import NativeAudioProcessor, native_audio_processor
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


def default_clip_repo(session: AsyncSession) -> SQLModelClipRepository:
    return SQLModelClipRepository(session)


def default_track_repo(session: AsyncSession) -> SQLModelTrackRepository:
    return SQLModelTrackRepository(session)


def default_audio_storage() -> S3StorageService:
    return S3StorageService(settings.STORAGE_NAME_AUDIO)


def default_audio_processor() -> NativeAudioProcessor:
    return native_audio_processor


def build_create_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_processor: AudioProcessor | None = None,
    audio_storage: AudioStorage | None = None,
) -> CreateTrack:
    return CreateTrack(
        session=session,
        track_repo=track_repo or default_track_repo(session),
        audio_processor=audio_processor or default_audio_processor(),
        audio_storage=audio_storage or default_audio_storage(),
    )


def build_read_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ReadTrack:
    return ReadTrack(
        session=session,
        track_repo=track_repo or default_track_repo(session),
        audio_storage=audio_storage or default_audio_storage(),
    )


def build_list_track(
    session: AsyncSession,
    track_repo: TrackRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ListTrack:
    return ListTrack(
        session=session,
        track_repo=track_repo or default_track_repo(session),
        audio_storage=audio_storage or default_audio_storage(),
    )


def build_list_clip(
    session: AsyncSession,
    clip_repo: ClipRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ListClip:
    return ListClip(
        session=session,
        clip_repo=clip_repo or default_clip_repo(session),
        audio_storage=audio_storage or default_audio_storage(),
    )


def build_read_clip(
    session: AsyncSession,
    clip_repo: ClipRepository | None = None,
    audio_storage: AudioStorage | None = None,
) -> ReadClip:
    return ReadClip(
        session=session,
        clip_repo=clip_repo or default_clip_repo(session),
        audio_storage=audio_storage or default_audio_storage(),
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
        clip_repo=clip_repo or default_clip_repo(session),
        track_repo=track_repo or default_track_repo(session),
        audio_processor=audio_processor or default_audio_processor(),
        audio_storage=audio_storage or default_audio_storage(),
    )
