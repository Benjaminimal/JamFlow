from unittest import mock

import pytest

from jamflow.core.config import settings
from jamflow.services.storage import get_track_storage_service


@pytest.fixture(scope="module")
def storage_name_override():
    # ensure that the bucket name is different for testing
    storage_name_track = f"{settings.STORAGE_NAME_TRACK}-test"
    with mock.patch.object(settings, "STORAGE_NAME_TRACK", storage_name_track):
        yield


@pytest.fixture
async def track_storage(storage_name_override):
    yield
    async with get_track_storage_service() as storage_service:
        # delete all files in the bucket
        await storage_service.purge()
