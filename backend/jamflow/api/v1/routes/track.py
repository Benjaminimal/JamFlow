from fastapi import APIRouter, Form, status

from jamflow.api.deps import SessionDep
from jamflow.schemas.track import TrackCreateDto, TrackReadDto
from jamflow.services.track import track_create

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TrackReadDto)
async def track_create_view(
    session: SessionDep, data: TrackCreateDto = Form(...)
) -> TrackReadDto:
    track = await track_create(session, track_create_dto=data)
    return track
