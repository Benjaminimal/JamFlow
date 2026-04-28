from fastapi import APIRouter, status
from pydantic import UUID4

from jamflow.infra.api.deps import CreateClipDep, ListClipDep, ReadClipDep
from jamflow.recordings.schemas import ClipCreateDto, ClipReadDto

router = APIRouter(prefix="/clips", tags=["clips"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Track not found",
            "content": {"application/json": {"example": {"detail": "Track not found"}}},
        }
    },
)
async def clip_create_view(
    use_case: CreateClipDep, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    clip = await use_case.execute(clip_create_dto)
    return clip


@router.get(
    "",
    status_code=status.HTTP_200_OK,
)
async def clip_list_view(
    use_case: ListClipDep,
    track_id: UUID4 | None = None,
) -> list[ClipReadDto]:
    return await use_case.execute(track_id)


@router.get(
    "/{clip_id}",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Clip not found",
            "content": {"application/json": {"example": {"detail": "Clip not found"}}},
        }
    },
)
async def clip_read_view(
    use_case: ReadClipDep,
    clip_id: UUID4,
) -> ClipReadDto:
    return await use_case.execute(clip_id)
