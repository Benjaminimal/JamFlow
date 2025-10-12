from unittest import mock

import pytest

from jamflow.core.config import settings
from jamflow.services.storage import get_audio_storage_service


@pytest.fixture(scope="session", autouse=True)
def storage_name_override():
    # ensure that the bucket name is different for testing
    storage_name_track = f"{settings.STORAGE_NAME_AUDIO}-test"
    with mock.patch.object(settings, "STORAGE_NAME_AUDIO", storage_name_track):
        yield


@pytest.fixture(scope="session", autouse=True)
def storage_public_url_override():
    # ensure that the public url is the same as the storage url for testing
    with mock.patch.object(settings, "STORAGE_PUBLIC_URL", settings.STORAGE_URL):
        yield


@pytest.fixture
async def audio_storage(
    storage_name_override,  # noqa: ARG001
):
    yield
    async with get_audio_storage_service() as storage_service:
        # delete all files in the bucket
        await storage_service.purge()
