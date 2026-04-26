from fastapi import APIRouter, Form, status
from pydantic import UUID4

from jamflow.infra.api.deps import CreateTrackDep, ReadTrackDep, SessionDep
from jamflow.recordings.schemas import (
    TrackCreateDto,
    TrackReadDto,
)
from jamflow.recordings.services.track import track_list

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TrackReadDto)
async def track_create_view(
    use_case: CreateTrackDep,
    data: TrackCreateDto = Form(..., media_type="multipart/form-data"),
) -> TrackReadDto:
    track = await use_case.execute(track_create_dto=data)
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
async def track_read_view(use_case: ReadTrackDep, track_id: UUID4) -> TrackReadDto:
    track = await use_case.execute(track_id=track_id)
    return track
