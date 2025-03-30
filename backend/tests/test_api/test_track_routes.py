import uuid
from pathlib import Path

import pytest
from fastapi import status
from httpx import AsyncClient

from jamflow.schemas.track import TrackCreateDto
from jamflow.services.track import track_create

pytestmark = [
    pytest.mark.integration,
    pytest.mark.usefixtures("track_storage"),
]


@pytest.fixture
def track_data():
    return {
        "title": "Test Track",
        "recorded_date": "2021-02-03",
    }


@pytest.fixture
def track_file(mp3_file: Path):
    return {"upload_file": ("dummy.mp3", mp3_file.read_bytes(), "audio/mpeg")}


@pytest.fixture
async def track_1(db_session, track_storage, mp3_upload_file):
    track_create_dto = TrackCreateDto(
        title="Test Track mp3",
        recorded_date="2021-02-03",
        upload_file=mp3_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


async def test_track_read_success(client: AsyncClient, track_1: TrackCreateDto):
    response = await client.get(f"/api/v1/tracks/{track_1.id}")
    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()
    assert {
        "id",
        "created_at",
        "updated_at",
        "title",
        "duration",
        "recorded_date",
        "format",
        "size",
    } == set(response_data.keys())
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
    assert {
        "id",
        "created_at",
        "updated_at",
        "title",
        "duration",
        "recorded_date",
        "format",
        "size",
    } == set(response_data.keys())
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
