from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from mutagen import MutagenError
from pytest_mock import MockerFixture

from jamflow.services.audio import (
    AudioFileFormat,
    AudioServiceException,
    get_audio_duration,
    get_audio_file_format,
    get_file_size,
)


def test_get_audio_file_format_returns_correct_format(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="mp3"))

    result = get_audio_file_format("test.mp3")

    assert result == AudioFileFormat.MP3


def test_get_audio_file_format_with_failing_detection_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=None)
    with pytest.raises(AudioServiceException, match="Cannot guess file type"):
        get_audio_file_format("test.mp3")


def test_get_audio_file_format_with_unsupported_type_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="exe"))

    with pytest.raises(AudioServiceException, match="Unsupported file type: exe"):
        get_audio_file_format("test.exe")


def test_get_audio_duration_for_valid_mp3_file_returns_duration_in_milliseconds(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock()
    mock_metadata.info.length = 5.0  # 5 seconds
    mock_mp3.return_value = mock_metadata

    result = get_audio_duration("dummy.mp3", AudioFileFormat.MP3)
    assert result == 5000  # 5000 milliseconds


def test_get_audio_duration_with_metadata_error_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_mp3.side_effect = MutagenError("Metadata error")

    with pytest.raises(AudioServiceException, match="Failed to read metadata"):
        get_audio_duration("dummy.mp3", AudioFileFormat.MP3)


def test_get_audio_duration_without_metadata_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock(info=None)
    mock_mp3.return_value = mock_metadata

    with pytest.raises(AudioServiceException, match="No metadata found"):
        get_audio_duration("dummy.mp3", AudioFileFormat.MP3)


@pytest.mark.parametrize(
    "audio_file,file_format",
    [
        ("wav_file", AudioFileFormat.WAV),
        ("ogg_file", AudioFileFormat.OGG),
        ("mp3_file", AudioFileFormat.MP3),
    ],
)
def test_get_audio_duration_returns_valid_duration_for_supported_formats(
    audio_file: str,
    file_format: AudioFileFormat,
    request: pytest.FixtureRequest,
):
    audio_file: Path = request.getfixturevalue(audio_file)
    duration = get_audio_duration(str(audio_file), file_format)
    assert 2400 <= duration <= 2600


def test_get_file_size_returns_correct_size():
    result = get_file_size(BytesIO(b"test data"))
    assert result == 9


def test_get_file_size_seeks_to_start():
    file_like = BytesIO(b"test data")
    file_like.seek(0, 2)

    result = get_file_size(file_like)

    assert result == 9
    assert file_like.tell() == 0


def test_get_file_size_with_empty_file_returns_zero():
    result = get_file_size(BytesIO(b""))
    assert result == 0


def test_get_file_size_on_closed_file_raises_value_error():
    file_like = BytesIO(b"test data")
    file_like.close()

    with pytest.raises(ValueError, match="I/O operation on closed file"):
        get_file_size(file_like)
