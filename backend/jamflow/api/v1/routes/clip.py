from fastapi import APIRouter, status

from jamflow.api.deps import SessionDep
from jamflow.schemas.clip import ClipCreateDto, ClipReadDto
from jamflow.services.clip import clip_create

router = APIRouter(prefix="/clips", tags=["clips"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ClipReadDto)
async def clip_create_view(
    session: SessionDep, clip_create_dto: ClipCreateDto
) -> ClipReadDto:
    clip = await clip_create(session, clip_create_dto=clip_create_dto)
    return clip
