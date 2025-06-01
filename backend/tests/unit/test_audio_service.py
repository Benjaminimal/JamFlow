from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from mutagen import MutagenError
from pydub import AudioSegment
from pytest_mock import MockerFixture

from jamflow.services.audio import (
    AudioFileFormat,
    AudioMimeType,
    AudioServiceException,
    clip_audio_file,
    get_audio_duration,
    get_audio_file_format,
    get_audio_mime_type,
    get_file_size,
)


def test_get_audio_file_format_returns_correct_format(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="mp3"))

    result = get_audio_file_format(mocker.MagicMock())

    assert result == AudioFileFormat.MP3


def test_get_audio_file_format_with_failing_detection_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=None)
    with pytest.raises(AudioServiceException, match="Cannot guess file type"):
        get_audio_file_format(mocker.MagicMock())


def test_get_audio_file_format_with_unsupported_type_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="exe"))

    with pytest.raises(AudioServiceException, match="Unsupported file type: exe"):
        get_audio_file_format(mocker.MagicMock())


def test_get_audio_duration_for_valid_mp3_file_returns_duration_in_milliseconds(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock()
    mock_metadata.info.length = 5.0  # 5 seconds
    mock_mp3.return_value = mock_metadata

    result = get_audio_duration(mocker.MagicMock(), AudioFileFormat.MP3)
    assert result == 5000  # 5000 milliseconds


def test_get_audio_duration_with_metadata_error_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_mp3.side_effect = MutagenError("Metadata error")

    with pytest.raises(AudioServiceException, match="Failed to read metadata"):
        get_audio_duration(mocker.MagicMock(), AudioFileFormat.MP3)


def test_get_audio_duration_without_metadata_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock(info=None)
    mock_mp3.return_value = mock_metadata

    with pytest.raises(AudioServiceException, match="No metadata found"):
        get_audio_duration(mocker.MagicMock(), AudioFileFormat.MP3)


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
    with audio_file.open("rb") as file:
        duration = get_audio_duration(file, file_format)
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


def test_clip_audio_file_returns_clipped_segment(mp3_file):
    start, end = 1000, 2000
    with open(mp3_file, "rb") as file_like:
        clipped_file = clip_audio_file(file_like, "mp3", start=start, end=end)

    clipped_segment = AudioSegment.from_file(clipped_file, format="mp3")
    assert 1000 <= len(clipped_segment) <= 1100


def test_clip_audio_file_with_invalid_format_raises_exception():
    with pytest.raises(AudioServiceException, match="Unsupported file format: invalid"):
        clip_audio_file(BytesIO(b"test data"), "invalid", start=0, end=1000)


def test_clip_audio_file_with_negative_start_raises_exception():
    with pytest.raises(AudioServiceException, match="Start cannot be negative"):
        clip_audio_file(BytesIO(b"test data"), "mp3", start=-1000, end=1000)


def test_clip_audio_file_with_invalid_range_raises_exception():
    with pytest.raises(AudioServiceException, match="Start must be less than end"):
        clip_audio_file(BytesIO(b"test data"), "mp3", start=2000, end=1000)


def test_clip_audio_file_with_empty_file_raises_exception():
    with pytest.raises(AudioServiceException, match="Cannot clip an empty file"):
        clip_audio_file(BytesIO(b""), "mp3", start=0, end=1000)


@pytest.mark.parametrize(
    "file_format,expected_mime_type",
    [
        (AudioFileFormat.MP3, AudioMimeType.MP3),
        (AudioFileFormat.OGG, AudioMimeType.OGG),
        (AudioFileFormat.WAV, AudioMimeType.WAV),
    ],
)
def test_get_audio_mime_type_works_for_all_accepted_audio_formats(
    file_format: AudioFileFormat,
    expected_mime_type: str,
):
    mime_type = get_audio_mime_type(file_format)
    assert mime_type == expected_mime_type


def test_get_audio_mime_type_raises_exception_for_unknown_format():
    with pytest.raises(AudioServiceException, match="Unsupported file format: unknown"):
        get_audio_mime_type("unknown")
