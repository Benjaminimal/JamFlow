from fastapi import APIRouter, Form, status
from pydantic import UUID4

from jamflow.api.deps import SessionDep
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.track import track_create, track_read

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TrackReadDto)
async def track_create_view(
    session: SessionDep, data: TrackCreateDto = Form(...)
) -> TrackReadDto:
    track = await track_create(session, track_create_dto=data)
    return track


@router.get(
    "/{track_id}",
    status_code=status.HTTP_200_OK,
    response_model=TrackReadDto,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Track not found"}},
)
async def track_read_view(session: SessionDep, track_id: UUID4) -> TrackReadDto:
    track = await track_read(session, track_id=track_id)
    return track
