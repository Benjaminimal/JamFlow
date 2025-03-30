from fastapi import APIRouter

from .routes import track

router = APIRouter(prefix="/v1")

router.include_router(track.router)
