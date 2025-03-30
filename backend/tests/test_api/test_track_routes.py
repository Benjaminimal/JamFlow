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


@pytest.fixture
async def track_2(db_session, track_storage, ogg_upload_file):
    track_create_dto = TrackCreateDto(
        title="Test Track ogg",
        recorded_date="2022-04-05",
        upload_file=ogg_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


@pytest.fixture
async def track_3(db_session, track_storage, wav_upload_file):
    track_create_dto = TrackCreateDto(
        title="Test Track wav",
        recorded_date="2023-06-07",
        upload_file=wav_upload_file,
    )
    return await track_create(db_session, track_create_dto=track_create_dto)


async def test_track_list_success(
    client: AsyncClient,
    track_1: TrackCreateDto,
    track_2: TrackCreateDto,
    track_3: TrackCreateDto,
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


async def test_track_read_success(client: AsyncClient, track_1: TrackCreateDto):
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
