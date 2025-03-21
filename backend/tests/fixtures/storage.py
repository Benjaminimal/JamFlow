from unittest import mock

import pytest

from jamflow.core.config import settings


@pytest.fixture(scope="module")
def storage_name_override():
    storage_name_track = f"{settings.STORAGE_NAME_TRACK}-test"
    with mock.patch.object(settings, "STORAGE_NAME_TRACK", storage_name_track):
        yield
