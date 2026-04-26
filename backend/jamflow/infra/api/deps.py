from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.infra.bootstrap import (
    build_create_clip,
    build_create_track,
    build_list_clip,
    build_list_track,
    build_read_clip,
    build_read_track,
)
from jamflow.infra.database import get_session
from jamflow.recordings.use_cases import (
    CreateClip,
    CreateTrack,
    ListClip,
    ListTrack,
    ReadClip,
    ReadTrack,
)

SessionDep = Annotated[
    AsyncSession,
    Depends(get_session),
]


def get_create_track(session: SessionDep) -> CreateTrack:
    return build_create_track(session)


CreateTrackDep = Annotated[
    CreateTrack,
    Depends(get_create_track),
]


def get_read_track(session: SessionDep) -> ReadTrack:
    return build_read_track(session)


ReadTrackDep = Annotated[
    ReadTrack,
    Depends(get_read_track),
]


def get_list_track(session: SessionDep) -> ListTrack:
    return build_list_track(session)


ListTrackDep = Annotated[
    ListTrack,
    Depends(get_list_track),
]


def get_create_clip(session: SessionDep) -> CreateClip:
    return build_create_clip(session)


CreateClipDep = Annotated[
    CreateClip,
    Depends(get_create_clip),
]


def get_list_clip(session: SessionDep) -> ListClip:
    return build_list_clip(session)


ListClipDep = Annotated[
    ListClip,
    Depends(get_list_clip),
]


def get_read_clip(session: SessionDep) -> ReadClip:
    return build_read_clip(session)


ReadClipDep = Annotated[
    ReadClip,
    Depends(get_read_clip),
]
