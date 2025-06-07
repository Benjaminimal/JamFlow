from fastapi import APIRouter, status
from pydantic import UUID4

from jamflow.api.deps import SessionDep
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.clip import clip_create, clip_list, clip_read

router = APIRouter(prefix="/clips", tags=["clips"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ClipReadDto,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Track not found",
            "content": {"application/json": {"example": {"detail": "Track not found"}}},
        }
    },
)
async def clip_create_view(
    session: SessionDep, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    clip = await clip_create(session, clip_create_dto=clip_create_dto)
    return clip


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=list[ClipReadDto],
)
async def clip_list_view(
    session: SessionDep,
    track_id: UUID4 | None = None,
) -> list[ClipReadDto]:
    return await clip_list(session, track_id=track_id)


@router.get(
    "/{clip_id}",
    status_code=status.HTTP_200_OK,
    response_model=ClipReadDto,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Clip not found",
            "content": {"application/json": {"example": {"detail": "Clip not found"}}},
        }
    },
)
async def clip_read_view(
    session: SessionDep,
    clip_id: UUID4,
) -> ClipReadDto:
    return await clip_read(session, clip_id=clip_id)
