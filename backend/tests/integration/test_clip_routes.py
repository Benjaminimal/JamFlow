from uuid import uuid4

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.models.clip import Clip
from jamflow.schemas.track import TrackReadDto


@pytest.fixture
def count_rows(db_session: AsyncSession):
    async def _count_rows(model):
        statement = select(func.count(col(model.id)))
        result = await db_session.exec(statement)
        return result.one()

    return _count_rows


@pytest.fixture
def clip_data(track_1: TrackReadDto):
    return {
        "title": "Test Clip",
        "track_id": str(track_1.id),
        "start": 1200,
        "end": 2100,
    }


async def test_clip_create_success(
    client: AsyncClient,
    db_session: AsyncSession,
    clip_data,
    count_rows,
):
    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    response_data = response.json()

    assert await count_rows(Clip) == 1
    assert (
        await db_session.exec(select(Clip).where(Clip.title == "Test Clip"))
    ).first() is not None

    assert set(response_data.keys()) == {
        "id",
        "title",
        "track_id",
        "start",
        "end",
        "created_at",
        "updated_at",
    }
    assert response_data["id"] is not None
    assert response_data["title"] == "Test Clip"
    assert response_data["track_id"] == clip_data["track_id"]
    assert response_data["start"] == 1200
    assert response_data["end"] == 2100


async def test_clip_create_track_not_found(
    client: AsyncClient,
    clip_data,
    count_rows,
):
    clip_data["track_id"] = str(uuid4())

    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content

    assert await count_rows(Clip) == 0

    response_data = response.json()
    assert response_data["detail"] == {"msg": "Track not found"}
