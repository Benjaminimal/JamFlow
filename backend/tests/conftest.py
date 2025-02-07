from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from jamflow.main import app


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    """
    Provide a FastAPI test client.
    """
    with TestClient(app) as c:
        yield c
