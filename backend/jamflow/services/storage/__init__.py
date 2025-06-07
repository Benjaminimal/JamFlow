from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from jamflow.core.config import settings

from .s3 import S3StorageService
from .types import StorageService

__all__ = [
    "StorageService",
    "get_audio_storage_service",
]


@asynccontextmanager
async def get_audio_storage_service() -> AsyncIterator[StorageService]:
    async with S3StorageService(settings.STORAGE_NAME_AUDIO) as service:
        yield service
