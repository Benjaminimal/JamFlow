from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.infra.bootstrap import build_create_clip, build_list_clip, build_read_clip
from jamflow.infra.database import get_session
from jamflow.recordings.use_cases import CreateClip, ListClip, ReadClip

SessionDep = Annotated[
    AsyncSession,
    Depends(get_session),
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
