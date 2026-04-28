from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from mutagen import MutagenError
from pydub import AudioSegment
from pytest_mock import MockerFixture

from jamflow.core.exceptions import ValidationError
from jamflow.infra.audio import AudioFileFormat, native_audio_processor


def test_get_format_returns_correct_format(mocker: MockerFixture):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="mp3"))

    result = native_audio_processor.get_format(mocker.MagicMock())

    assert result == AudioFileFormat.MP3


def test_get_format_with_failing_detection_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=None)
    with pytest.raises(ValidationError, match="Cannot guess file type"):
        native_audio_processor.get_format(mocker.MagicMock())


def test_get_format_with_unsupported_type_raises_exception(
    mocker: MockerFixture,
):
    mocker.patch("filetype.guess", return_value=MagicMock(extension="exe"))

    with pytest.raises(ValidationError, match="Unsupported file type: exe"):
        native_audio_processor.get_format(mocker.MagicMock())


def test_get_duration_for_valid_mp3_file_returns_duration_in_milliseconds(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.infra.audio.MP3")
    mock_metadata = MagicMock()
    mock_metadata.info.length = 5.0  # 5 seconds
    mock_mp3.return_value = mock_metadata

    result = native_audio_processor.get_duration(
        mocker.MagicMock(), AudioFileFormat.MP3
    )
    assert result == 5000  # 5000 milliseconds


def test_get_duration_with_metadata_error_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.infra.audio.MP3")
    mock_mp3.side_effect = MutagenError("Metadata error")

    with pytest.raises(ValidationError, match="Failed to read metadata"):
        native_audio_processor.get_duration(mocker.MagicMock(), AudioFileFormat.MP3)


def test_get_duration_without_metadata_raises_audio_service_exception(
    mocker: MockerFixture,
):
    mock_mp3 = mocker.patch("jamflow.infra.audio.MP3")
    mock_metadata = MagicMock(info=None)
    mock_mp3.return_value = mock_metadata

    with pytest.raises(ValidationError, match="No metadata found"):
        native_audio_processor.get_duration(mocker.MagicMock(), AudioFileFormat.MP3)


@pytest.mark.parametrize(
    ("audio_file", "file_format"),
    [
        ("wav_file", AudioFileFormat.WAV),
        ("ogg_file", AudioFileFormat.OGG),
        ("mp3_file", AudioFileFormat.MP3),
    ],
)
def test_get_duration_returns_valid_duration_for_supported_formats(
    audio_file: str,
    file_format: AudioFileFormat,
    request: pytest.FixtureRequest,
):
    audio_file: Path = request.getfixturevalue(audio_file)
    with audio_file.open("rb") as file:
        duration = native_audio_processor.get_duration(file, file_format)
    assert 2400 <= duration <= 2600


def test_get_size_returns_correct_size():
    result = native_audio_processor.get_size(BytesIO(b"test data"))
    assert result == 9


def test_get_size_seeks_to_start():
    file_like = BytesIO(b"test data")
    file_like.seek(0, 2)

    native_audio_processor.get_size(file_like)

    assert file_like.tell() == 0


def test_get_size_with_empty_file_returns_zero():
    result = native_audio_processor.get_size(BytesIO(b""))
    assert result == 0


def test_get_size_on_closed_file_raises_value_error():
    file_like = BytesIO(b"test data")
    file_like.close()

    with pytest.raises(ValueError, match="I/O operation on closed file"):
        native_audio_processor.get_size(file_like)


def test_clip_returns_clipped_segment(wav_file: Path):
    start, end = 1000, 2000
    with open(wav_file, "rb") as file_like:
        clipped_file = native_audio_processor.clip(
            file_like, AudioFileFormat.WAV, start=start, end=end
        )

    clipped_segment = AudioSegment.from_file(clipped_file, format="wav")
    assert 1000 <= len(clipped_segment) <= 1100

    original_segment = AudioSegment.from_file(wav_file, format="wav")
    assert original_segment[start:end].raw_data == clipped_segment.raw_data


def test_clip_with_invalid_format_raises_exception():
    with pytest.raises(ValidationError, match="Unsupported file format: invalid"):
        native_audio_processor.clip(
            BytesIO(b"test data"),
            "invalid",  # ty: ignore[invalid-argument-type]
            start=0,
            end=1000,
        )


def test_clip_with_negative_start_raises_exception():
    with pytest.raises(ValidationError, match="Start cannot be negative"):
        native_audio_processor.clip(
            BytesIO(b"test data"), AudioFileFormat.MP3, start=-1000, end=1000
        )


def test_clip_with_invalid_range_raises_exception():
    with pytest.raises(ValidationError, match="Start must be less than end"):
        native_audio_processor.clip(
            BytesIO(b"test data"), AudioFileFormat.MP3, start=2000, end=1000
        )


def test_clip_with_empty_file_raises_exception():
    with pytest.raises(ValidationError, match="Cannot clip an empty file"):
        native_audio_processor.clip(
            BytesIO(b""), AudioFileFormat.MP3, start=0, end=1000
        )
