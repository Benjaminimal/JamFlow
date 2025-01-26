from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.core.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # app startup
    await init_db()
    yield
    # app teardown


app = FastAPI(
    lifespan=lifespan,
)


@app.get("/")
async def read_root():
    return {"Hello": f"World. Welcome to {settings.PROJECT_NAME}!"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
