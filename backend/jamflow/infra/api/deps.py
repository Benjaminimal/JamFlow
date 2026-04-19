from functools import cache
from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.config import settings
from jamflow.infra.audio import audio_processor
from jamflow.infra.database import get_session
from jamflow.infra.database.repositories import (
    SQLModelClipRepository,
    SQLModelTrackRepository,
)
from jamflow.infra.storage import S3StorageService
from jamflow.recordings.protocols import (
    AudioProcessor,
    AudioStorage,
    ClipRepository,
    TrackRepository,
)
from jamflow.recordings.use_cases import CreateClip, ListClip, ReadClip

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_clip_repo(session: SessionDep) -> ClipRepository:
    return SQLModelClipRepository(session)


ClipRepoDep = Annotated[ClipRepository, Depends(get_clip_repo)]


def get_track_repo(session: SessionDep) -> TrackRepository:
    return SQLModelTrackRepository(session)


TrackRepoDep = Annotated[TrackRepository, Depends(get_track_repo)]


@cache
def get_audio_storage() -> AudioStorage:
    return S3StorageService(settings.STORAGE_NAME_AUDIO)


AudioStorageDep = Annotated[AudioStorage, Depends(get_audio_storage)]


def get_audio_processor() -> AudioProcessor:
    return audio_processor


AudioProcessorDep = Annotated[AudioProcessor, Depends(get_audio_processor)]


def get_create_clip(
    session: SessionDep,
    clip_repo: ClipRepoDep,
    track_repo: TrackRepoDep,
    audio_storage: AudioStorageDep,
    audio_processor: AudioProcessorDep,
) -> CreateClip:
    return CreateClip(
        clip_repo=clip_repo,
        track_repo=track_repo,
        session=session,
        audio_storage=audio_storage,
        audio_processor=audio_processor,
    )


CreateClipDep = Annotated[CreateClip, Depends(get_create_clip)]


def get_list_clip(
    session: SessionDep,
    clip_repo: ClipRepoDep,
    audio_storage: AudioStorageDep,
) -> ListClip:
    return ListClip(
        clip_repo=clip_repo,
        session=session,
        audio_storage=audio_storage,
    )


ListClipDep = Annotated[ListClip, Depends(get_list_clip)]


def get_read_clip(
    session: SessionDep,
    clip_repo: ClipRepoDep,
    audio_storage: AudioStorageDep,
) -> ReadClip:
    return ReadClip(
        clip_repo=clip_repo,
        session=session,
        audio_storage=audio_storage,
    )


ReadClipDep = Annotated[ReadClip, Depends(get_read_clip)]
