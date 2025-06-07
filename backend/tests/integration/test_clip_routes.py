from uuid import uuid4

import pytest
from fastapi import status
from httpx import AsyncClient

from jamflow.models.clip import Clip
from jamflow.schemas.clip import ClipReadDto
from jamflow.schemas.track import TrackReadDto


@pytest.fixture
def clip_data(track_1: TrackReadDto):
    return {
        "title": "Test Clip",
        "track_id": str(track_1.id),
        "start": 1200,
        "end": 2100,
    }


async def test_clip_create_returns_complete_clip_with_extracted_metadata(
    client: AsyncClient,
    clip_data,
    count_rows,
    get_row,
):
    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_201_CREATED, response.content
    response_data = response.json()

    assert set(response_data.keys()) == {
        "id",
        "title",
        "track_id",
        "duration",
        "start",
        "end",
        "created_at",
        "updated_at",
        "format",
        "size",
        "url",
    }
    assert response_data["id"] is not None
    assert response_data["title"] == "Test Clip"
    assert response_data["track_id"] == clip_data["track_id"]
    assert response_data["duration"] == 900
    assert response_data["start"] == 1200
    assert response_data["end"] == 2100
    assert response_data["format"] == "mp3"

    assert await count_rows(Clip) == 1
    persisted_clip = await get_row(Clip, "Test Clip", column=Clip.title)
    assert persisted_clip is not None
    assert str(persisted_clip.id) == response_data["id"]


async def test_clip_create_with_non_existent_track_returns_404(
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


async def test_clip_create_with_overlapping_times_returns_422(
    client: AsyncClient,
    clip_data,
):
    clip_data["start"] = 2000
    clip_data["end"] = 1000

    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["body"]
    assert (
        response_data["detail"][0]["msg"] == "Value error, Start must be less than end"
    )


async def test_clip_create_with_empty_title_returns_422(
    client: AsyncClient,
    clip_data,
):
    clip_data["title"] = "\t \n"

    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response_data = response.json()
    assert response_data["detail"][0]["loc"] == ["body", "title"]
    assert (
        response_data["detail"][0]["msg"] == "String should have at least 1 character"
    )


async def test_clip_create_with_end_gt_track_length_returns_422(
    client: AsyncClient,
    clip_data,
):
    clip_data["end"] = 3000

    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response_data = response.json()
    # assert False, response_data
    assert response_data["detail"]["field"] == "end"
    assert response_data["detail"]["msg"] == "Clip end time exceeds track duration"


async def test_clip_list_without_clips_returns_empty_list(client: AsyncClient):
    response = await client.get("/api/v1/clips")
    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.json() == []


async def test_clip_list_with_two_clips_returns_all(
    client: AsyncClient,
    clip_1: ClipReadDto,
    clip_2: ClipReadDto,
    track_1: TrackReadDto,
    track_2: TrackReadDto,
):
    response = await client.get("/api/v1/clips")
    assert response.status_code == status.HTTP_200_OK, response.content
    clips = response.json()
    assert len(clips) == 2
    assert all(
        set(clip.keys())
        == {
            "id",
            "title",
            "track_id",
            "duration",
            "start",
            "end",
            "created_at",
            "updated_at",
            "format",
            "size",
            "url",
        }
        for clip in clips
    )

    clip_1_data, clip_2_data = clips
    assert clip_1_data["id"] == str(clip_1.id)
    assert clip_1_data["title"] == "Test Clip 1"
    assert clip_1_data["track_id"] == str(track_1.id)
    assert clip_1_data["url"].startswith(("http://", "https://"))
    assert clip_2_data["id"] == str(clip_2.id)
    assert clip_2_data["title"] == "Test Clip 2"
    assert clip_2_data["track_id"] == str(track_2.id)
    assert clip_2_data["url"].startswith(("http://", "https://"))


async def test_list_clip_with_track_id_filter_returns_filtered_clips(
    client: AsyncClient,
    clip_1: ClipReadDto,
    clip_2: ClipReadDto,  # noqa: ARG001
    track_1: TrackReadDto,
):
    response = await client.get("/api/v1/clips", params={"track_id": track_1.id})
    assert response.status_code == status.HTTP_200_OK, response.content
    clips = response.json()

    assert len(clips) == 1
    assert clips[0]["id"] == str(clip_1.id)
    assert clips[0]["title"] == "Test Clip 1"
    assert clips[0]["track_id"] == str(track_1.id)


async def test_list_clip_with_non_existent_track_id_returns_empty_list(
    client: AsyncClient,
    clip_1: ClipReadDto,  # noqa: ARG001
    track_1: TrackReadDto,  # noqa: ARG001
):
    response = await client.get("/api/v1/clips", params={"track_id": str(uuid4())})
    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.json() == []


async def test_clip_read_with_existing_clip_returns_expected_response(
    client: AsyncClient,
    clip_1: ClipReadDto,
):
    response = await client.get(f"/api/v1/clips/{clip_1.id}")
    assert response.status_code == status.HTTP_200_OK, response.content
    response_data = response.json()

    assert set(response_data.keys()) == {
        "id",
        "title",
        "track_id",
        "duration",
        "start",
        "end",
        "created_at",
        "updated_at",
        "format",
        "size",
        "url",
    }
    assert response_data["id"] == str(clip_1.id)
    assert response_data["title"] == "Test Clip 1"
    assert response_data["track_id"] == str(clip_1.track_id)
    assert response_data["duration"] == 1000
    assert response_data["start"] == 0
    assert response_data["end"] == 1000
    assert response_data["format"] == "mp3"
    assert response_data["url"].startswith(("http://", "https://"))


async def test_clip_read_with_non_existent_clip_returns_404(
    client: AsyncClient,
):
    response = await client.get(f"/api/v1/clips/{uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content

    response_data = response.json()
    assert response_data["detail"] == {"msg": "Clip not found"}
