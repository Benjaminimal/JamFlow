import pytest
from fastapi import Path
from httpx import AsyncClient


@pytest.fixture
def track_data():
    return {
        "title": "Test Track",
        "recorded_date": "2021-02-03",
    }


@pytest.fixture
def track_file(mp3_file: Path):
    return {"upload_file": ("dummy.mp3", mp3_file.read_bytes(), "audio/mpeg")}


async def test_audio_workflow_success(client: AsyncClient, track_file, track_data):
    # Upload an MP3 file and verify it is successfully stored
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == 201, response.content
    track_id = response.json()["id"]
    track_url = response.json()["url"]

    # TODO: just deliver the signed URL for the uploaded track

    # Download the file and verify it is accessible
    response = await client.get(track_url)
    assert response.status_code == 200, response.content
    # TODO: assert unmutated file

    # Create a clip from the uploaded track and verify the operation succeeds
    clip_data = {
        "title": "Test Clip",
        "start": 10,
        "end": 20,
        "track_id": track_id,
    }
    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == 201, response.content
    clip_url = response.json()["url"]

    # Download the clip and verify it is accessible
    response = await client.get(clip_url)
    assert response.status_code == 200, response.content
    # TODO: assert unmutated file
