from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from jamflow.core.config import settings

from .s3 import S3StorageService
from .types import StorageService

__all__ = [
    "StorageService",
    "get_track_storage_service",
]


@asynccontextmanager
async def get_track_storage_service() -> AsyncIterator[StorageService]:
    async with S3StorageService(settings.STORAGE_NAME_TRACK) as service:
        yield service
