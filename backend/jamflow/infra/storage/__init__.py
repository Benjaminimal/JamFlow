from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from jamflow.core.config import settings

from .s3 import S3StorageService

__all__ = [
    "get_audio_storage_service",
]


# TODO: remove when services are gone
@asynccontextmanager
async def get_audio_storage_service() -> AsyncIterator[S3StorageService]:
    async with S3StorageService(settings.STORAGE_NAME_AUDIO) as service:
        yield service
