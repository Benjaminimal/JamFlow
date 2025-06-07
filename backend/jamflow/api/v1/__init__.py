from fastapi import APIRouter

from .routes import clip, track

router = APIRouter(prefix="/v1")

router.include_router(track.router)
router.include_router(clip.router)
