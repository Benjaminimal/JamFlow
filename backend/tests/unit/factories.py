import uuid

from jamflow.recordings.models import AudioFileFormat, Track
from jamflow.recordings.schemas import ClipCreateDto


def make_create_clip_dto(**overrides) -> ClipCreateDto:
    defaults = {
        "title": "Test Clip",
        "track_id": uuid.uuid4(),
        "start": 1200,
        "end": 2100,
    }
    return ClipCreateDto.model_validate(defaults | overrides)


def make_track(**overrides) -> Track:
    defaults = {
        "id": uuid.uuid4(),
        "title": "Track 1",
        "duration": 5_000,
        "format": AudioFileFormat.MP3,
        "size": 123,
        "path": "some/path.mp3",
        "recorded_date": None,
    }
    return Track(**(defaults | overrides))
