import pytest
from fastapi import FastAPI

from jamflow.core.app import create_app


@pytest.fixture(scope="session")
def app() -> FastAPI:
    return create_app(configure_logs=False)
