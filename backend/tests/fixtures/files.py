from io import BytesIO
from pathlib import Path

import pytest
from fastapi import UploadFile

AUDIO_DATA_DIR = Path(__file__).parent.parent / "data"


@pytest.fixture(scope="module")
def wav_file() -> Path:
    """Fixture to generate a 2.4-second WAV file."""
    return AUDIO_DATA_DIR / "sine-440hz-2.4s-mono-44khz.wav"


@pytest.fixture(scope="module")
def mp3_file() -> Path:
    """Fixture to generate a 2.4-second MP3 file."""
    return AUDIO_DATA_DIR / "sine-440hz-2.4s-mono-44khz.mp3"


@pytest.fixture(scope="module")
def ogg_file() -> Path:
    """Fixture to generate a 2.4-second OGG file."""
    return AUDIO_DATA_DIR / "sine-440hz-2.4s-mono-44khz.ogg"


@pytest.fixture
def wav_upload_file(wav_file: Path) -> UploadFile:
    """Fixture to return a FastAPI UploadFile for WAV."""
    with open(wav_file, "rb") as file:
        file_content = BytesIO(file.read())
    return UploadFile(
        filename="test.wav", file=file_content, size=wav_file.stat().st_size
    )


@pytest.fixture
async def mp3_upload_file(mp3_file: Path) -> UploadFile:
    """Fixture to return a FastAPI UploadFile for MP3."""
    with open(mp3_file, "rb") as file:
        file_content = BytesIO(file.read())
    return UploadFile(
        filename="test.mp3", file=file_content, size=mp3_file.stat().st_size
    )


@pytest.fixture
async def ogg_upload_file(ogg_file: Path) -> UploadFile:
    """Fixture to return a FastAPI UploadFile for OGG."""
    with open(ogg_file, "rb") as file:
        file_content = BytesIO(file.read())
    return UploadFile(
        filename="test.ogg", file=file_content, size=ogg_file.stat().st_size
    )


@pytest.fixture
def txt_upload_file() -> UploadFile:
    """Fixture to return a FastAPI UploadFile for TXT."""

    file_content = b"testtext"
    return UploadFile(
        filename="test.mp3", file=BytesIO(file_content), size=len(file_content)
    )
