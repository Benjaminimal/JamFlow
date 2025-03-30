from unittest.mock import MagicMock

import pytest
from mutagen import MutagenError
from pytest_mock import MockerFixture

from jamflow.services.audio import (
    AudioFileFormat,
    AudioServiceException,
    get_audio_duration,
    get_audio_file_format,
)

pytest_mark = pytest.mark.unit


def test_get_audio_file_format_success(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="mp3"))

    result = get_audio_file_format("test.mp3")

    assert result == AudioFileFormat.MP3


def test_get_audio_file_format_guess_fails(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=None)
    with pytest.raises(AudioServiceException, match="Cannot guess file type"):
        get_audio_file_format("test.mp3")


def test_get_audio_file_format_unsupported_type(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="exe"))

    with pytest.raises(AudioServiceException, match="Unsupported file type: EXE"):
        get_audio_file_format("test.exe")


def test_get_audio_duration_success(mocker: MockerFixture):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock()
    mock_metadata.info.length = 5.0  # 5 seconds
    mock_mp3.return_value = mock_metadata

    result = get_audio_duration("dummy.mp3", AudioFileFormat.MP3)
    assert result == 5000  # 5000 milliseconds


def test_get_audio_duration_metadata_error(mocker: MockerFixture):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_mp3.side_effect = MutagenError("Metadata error")

    with pytest.raises(AudioServiceException, match="Failed to read metadata"):
        get_audio_duration("dummy.mp3", AudioFileFormat.MP3)


def test_get_audio_duration_no_metadata(mocker: MockerFixture):
    mock_mp3 = mocker.patch("jamflow.services.audio.MP3")
    mock_metadata = MagicMock(info=None)
    mock_mp3.return_value = mock_metadata

    with pytest.raises(AudioServiceException, match="No metadata found"):
        get_audio_duration("dummy.mp3", AudioFileFormat.MP3)
