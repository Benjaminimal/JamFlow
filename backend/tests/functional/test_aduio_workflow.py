from io import BytesIO

import pytest
from fastapi import Path
from httpx import AsyncClient
from pydub import AudioSegment

pytestmark = pytest.mark.usefixtures("audio_storage")


@pytest.fixture
def track_data():
    return {
        "title": "Test Track",
        "recorded_date": "2021-02-03",
    }


@pytest.fixture
def track_file(wav_file: Path):
    return {"upload_file": ("dummy.wav", wav_file.read_bytes(), "audio/wav")}


async def test_track_upload_and_clip_create(
    client: AsyncClient,
    public_client: AsyncClient,
    track_file,
    track_data,
):
    # Upload a wav file and verify it is successfully stored
    response = await client.post("/api/v1/tracks", files=track_file, data=track_data)
    assert response.status_code == 201, response.content
    track_id = response.json()["id"]
    track_url = response.json()["url"]

    # Download the file and verify it is the same as the uploaded file
    response = await public_client.get(track_url)
    assert response.status_code == 200, response.content
    assert response.headers["Content-Type"] == "audio/wav"
    assert response.content == track_file["upload_file"][1]
    track_segment = AudioSegment.from_file(BytesIO(response.content), format="wav")

    # Create a clip from the uploaded track and verify the operation succeeds
    clip_data = {
        "title": "Test Clip 1",
        "start": 1000,
        "end": 2000,
        "track_id": track_id,
    }
    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == 201, response.content
    clip_url = response.json()["url"]

    # Download the clip and verify the correct content
    response = await public_client.get(clip_url)
    assert response.status_code == 200, response.content
    assert response.headers["Content-Type"] == "audio/wav"
    clip_segment = AudioSegment.from_file(BytesIO(response.content), format="wav")
    assert len(clip_segment) == 1000
    expected_clip = track_segment[1000:2000]
    assert clip_segment.raw_data == expected_clip.raw_data

    # Create one more clip with a different start and end time
    clip_data = {
        "title": "Test Clip 2",
        "start": 0,
        "end": 1500,
        "track_id": track_id,
    }
    response = await client.post("/api/v1/clips", json=clip_data)
    assert response.status_code == 201, response.content

    # List all clips for the track
    response = await client.get("/api/v1/clips", params={"track_id": track_id})
    assert response.status_code == 200, response.content
    clips = response.json()
    assert len(clips) == 2
    assert clips[0]["title"] == "Test Clip 1"
    assert clips[1]["title"] == "Test Clip 2"
