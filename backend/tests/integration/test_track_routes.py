import uuid
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi import status
from httpx import AsyncClient

from jamflow.schemas.track import TrackReadDto
from jamflow.utils import timezone_now

pytestmark = pytest.mark.usefixtures("track_storage")


@pytest.fixture
def track_data():
    return {
        "title": "Test Track",
        "recorded_date": "2021-02-03",
    }


@pytest.fixture
def track_file(mp3_file: Path):
    return {"upload_file": ("dummy.mp3", mp3_file.read_bytes(), "audio/mpeg")}


async def test_track_list_success(
    client: AsyncClient,
    track_1: TrackReadDto,
    track_2: TrackReadDto,
    track_3: TrackReadDto,
):
    response = await client.get("/api/v1/tracks")
    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()
    assert len(response_data) == 3
    track_1_data, track_2_data, track_3_data = response_data
    assert track_1_data.keys() | track_2_data.keys() | track_3_data.keys() == {
        "id",
        "created_at",
        "updated_at",
        "title",
        "duration",
        "recorded_date",
        "format",
        "size",
    }
    assert track_1_data["id"] == str(track_1.id)
    assert track_1_data["title"] == "Test Track mp3"
    assert track_2_data["id"] == str(track_2.id)
    assert track_2_data["title"] == "Test Track ogg"
    assert track_3_data["id"] == str(track_3.id)
    assert track_3_data["title"] == "Test Track wav"


async def test_track_list_empty_success(client: AsyncClient):
    response = await client.get("/api/v1/tracks")
    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()
    assert len(response_data) == 0


async def test_track_read_success(client: AsyncClient, track_1: TrackReadDto):
    response = await client.get(f"/api/v1/tracks/{track_1.id}")
    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()
    assert set(response_data.keys()) == {
        "id",
        "created_at",
        "updated_at",
        "title",
        "duration",
        "recorded_date",
        "format",
        "size",
    }
    assert response_data["title"] == "Test Track mp3"
    assert 2400 <= response_data["duration"] <= 2600
    assert response_data["recorded_date"] == "2021-02-03"
    assert response_data["format"] == "MP3"
    assert response_data["size"] == 5269


async def test_track_read_not_found_error(client: AsyncClient):
    response = await client.get(f"/api/v1/tracks/{uuid.uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
    response_data = response.json()
    assert response_data == {"detail": {"msg": "Track not found"}}


async def test_track_create_success(client: AsyncClient, track_data, track_file):
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    response_data = response.json()
    assert set(response_data.keys()) == {
        "id",
        "created_at",
        "updated_at",
        "title",
        "duration",
        "recorded_date",
        "format",
        "size",
    }
    assert response_data["title"] == track_data["title"]
    assert 2400 <= response_data["duration"] <= 2600
    assert response_data["recorded_date"] == "2021-02-03"
    assert response_data["format"] == "MP3"
    assert response_data["size"] == 5269


async def test_track_create_none_recorded_date_success(
    client: AsyncClient, track_data, track_file
):
    track_data["recorded_date"] = None
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    response_data = response.json()
    assert response_data["recorded_date"] is None


async def test_track_create_missing_recorded_date_success(
    client: AsyncClient, track_data, track_file
):
    del track_data["recorded_date"]
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    response_data = response.json()
    assert response_data["recorded_date"] is None


async def test_track_create_blank_title_error(
    client: AsyncClient, track_data, track_file
):
    track_data["title"] = "\n \t"
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["body", "title"]
    assert (
        response_data["detail"][0]["msg"] == "String should have at least 1 character"
    )


async def test_track_create_missing_file_error(
    client: AsyncClient, track_data, track_file
):
    response = await client.post("/api/v1/tracks", data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["body", "upload_file"]
    assert response_data["detail"][0]["msg"] == "Field required"


async def test_track_create_empty_file_error(
    client: AsyncClient, track_data, track_file
):
    track_file["upload_file"] = ("empty.mp3", b"", "audio/mpeg")
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["body", "upload_file"]
    assert response_data["detail"][0]["msg"] == "Value error, File is empty"


async def test_track_get_urls_success(
    client: AsyncClient,
    track_1: TrackReadDto,
    track_2: TrackReadDto,
    track_3: TrackReadDto,
):
    expires_at_min = timezone_now() + timedelta(hours=1)
    expires_at_max = expires_at_min + timedelta(seconds=1)

    response = await client.get(
        "/api/v1/tracks/urls",
        params={"track_ids": [track_1.id, track_2.id]},
    )

    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()
    assert len(response_data) == 2
    track_1_data, track_2_data = response_data
    assert track_1_data.keys() | track_2_data.keys() == {
        "track_id",
        "url",
        "expires_at",
    }
    assert track_1_data["track_id"] == str(track_1.id)
    assert ".mp3" in track_1_data["url"]
    assert (
        expires_at_min
        <= datetime.fromisoformat(track_1_data["expires_at"])
        <= expires_at_max
    )
    assert track_2_data["track_id"] == str(track_2.id)
    assert ".ogg" in track_2_data["url"]
    assert (
        expires_at_min
        <= datetime.fromisoformat(track_2_data["expires_at"])
        <= expires_at_max
    )


async def test_track_get_urls_no_tack_id_error(
    client: AsyncClient, track_1: TrackReadDto
):
    response = await client.get("/api/v1/tracks/urls")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, (
        response.content
    )
    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["query", "track_ids"]
    assert response_data["detail"][0]["msg"] == "Field required"
