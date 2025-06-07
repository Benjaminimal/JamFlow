from typing import Annotated

from fastapi import APIRouter, Form, Query, status
from pydantic import UUID4

from jamflow.api.deps import SessionDep
from jamflow.schemas.track import TrackCreateDto, TrackReadDto, TrackSignedUrlDto
from jamflow.services.track import (
    track_create,
    track_generate_signed_urls,
    track_list,
    track_read,
)

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TrackReadDto)
async def track_create_view(
    session: SessionDep,
    data: TrackCreateDto = Form(..., media_type="multipart/form-data"),
) -> TrackReadDto:
    track = await track_create(session, track_create_dto=data)
    return track


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[TrackReadDto],
)
async def track_list_view(session: SessionDep) -> list[TrackReadDto]:
    tracks = await track_list(session)
    return tracks


@router.get(
    "/{track_id:uuid}",
    status_code=status.HTTP_200_OK,
    response_model=TrackReadDto,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Track not found",
            "content": {
                "application/json": {"example": {"detail": {"msg": "Track not found"}}}
            },
        },
    },
)
async def track_read_view(session: SessionDep, track_id: UUID4) -> TrackReadDto:
    track = await track_read(session, track_id=track_id)
    return track


@router.get("/urls")
async def track_generate_signed_urls_view(
    session: SessionDep,
    track_ids: Annotated[list[UUID4], Query(..., min_length=1)],
) -> list[TrackSignedUrlDto]:
    track_generate_signed_url_dtos = await track_generate_signed_urls(
        session,
        track_ids=track_ids,
    )
    return track_generate_signed_url_dtos
