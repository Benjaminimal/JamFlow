from io import BytesIO
from pathlib import Path

import pytest
from fastapi import UploadFile
from pydub import AudioSegment
from pytest import TempPathFactory


@pytest.fixture(scope="module")
def temp_test_dir(tmp_path_factory: TempPathFactory) -> Path:
    """Fixture that provides a temporary directory for all generated audio files."""
    # Create a temporary directory for audio test files
    dir_path = tmp_path_factory.mktemp("test_files")

    yield dir_path

    # Cleanup any files when the test session ends
    for file in dir_path.iterdir():
        file.unlink()  # Delete the file
    dir_path.rmdir()  # Delete the directory


@pytest.fixture(scope="module")
def wav_file(temp_test_dir: Path) -> Path:
    """Fixture to generate a 2.4-second WAV file."""
    file_path = temp_test_dir / "test.wav"
    silent_audio = AudioSegment.silent(duration=2400)
    silent_audio.export(file_path, format="wav")
    yield file_path
    if file_path.exists():
        file_path.unlink()


@pytest.fixture(scope="module")
def mp3_file(temp_test_dir: Path) -> Path:
    """Fixture to generate a 2.4-second MP3 file."""
    file_path = temp_test_dir / "test.mp3"
    silent_audio = AudioSegment.silent(duration=2400)
    silent_audio.export(file_path, format="mp3")
    yield file_path
    if file_path.exists():
        file_path.unlink()


@pytest.fixture(scope="module")
def ogg_file(temp_test_dir: Path) -> Path:
    """Fixture to generate a 2.4-second OGG file."""
    file_path = temp_test_dir / "test.ogg"
    silent_audio = AudioSegment.silent(duration=2400)
    silent_audio.export(file_path, format="ogg")
    yield file_path
    if file_path.exists():
        file_path.unlink()


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
