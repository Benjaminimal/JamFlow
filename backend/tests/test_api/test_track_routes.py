import pytest
from fastapi import status
from httpx import AsyncClient

pytestmark = pytest.mark.usefixtures("track_storage")


@pytest.fixture
def track_data():
    return {
        "title": "Test Track",
        "recorded_date": "2021-02-03",
    }


@pytest.fixture
def track_file():
    return {"upload_file": ("dummy.mp3", b"dummy content", "audio/mpeg")}


@pytest.mark.integration
async def test_create_track(client: AsyncClient, track_data, track_file):
    response = await client.post("/api/v1/tracks/", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    data = response.json()
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["title"] == track_data["title"]
    assert data["duration"] == 123
    assert data["recorded_date"] == "2021-02-03"
    assert data["file_format"] == "MP3"
    assert data["file_size"] == 13


@pytest.mark.integration
async def test_create_track_none_recorded_date(
    client: AsyncClient, track_data, track_file
):
    track_data["recorded_date"] = None
    response = await client.post("/api/v1/tracks/", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    data = response.json()
    assert data["recorded_date"] is None


@pytest.mark.integration
async def test_create_track_missing_recorded_date(
    client: AsyncClient, track_data, track_file
):
    del track_data["recorded_date"]
    response = await client.post("/api/v1/tracks/", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    data = response.json()
    assert data["recorded_date"] is None


@pytest.mark.integration
async def test_create_track_blank_title(client: AsyncClient, track_data, track_file):
    track_data["title"] = "\n \t"
    response = await client.post("/api/v1/tracks/", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
async def test_create_track_missing_file(client: AsyncClient, track_data, track_file):
    response = await client.post("/api/v1/tracks/", data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
async def test_create_track_empty_file(client: AsyncClient, track_data, track_file):
    track_file["upload_file"] = ("empty.mp3", b"", "audio/mpeg")
    response = await client.post("/api/v1/tracks/", files=track_file, data=track_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
