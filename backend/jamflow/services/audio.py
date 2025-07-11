from enum import StrEnum
from tempfile import TemporaryFile
from typing import BinaryIO

import filetype  # type: ignore [import-untyped]
from mutagen import MutagenError  # type: ignore [attr-defined]
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE
from pydub import AudioSegment  # type: ignore [import-untyped]

from jamflow.core.exceptions import BusinessLogicError, ValidationError
from jamflow.models.enums import AudioFileFormat


class AudioMimeType(StrEnum):
    MP3 = "audio/mpeg"
    OGG = "audio/ogg"
    WAV = "audio/wav"


def get_audio_file_format(file: BinaryIO) -> AudioFileFormat:
    """
    Guesses the file type of an audio file.

    :raises ValidationError: If the file type cannot be guessed or is not supported.
    """
    kind = filetype.guess(file)
    if kind is None:
        raise ValidationError("Cannot guess file type")
    extension = kind.extension
    if extension not in AudioFileFormat:
        raise ValidationError(f"Unsupported file type: {extension}")
    return AudioFileFormat(extension)


def get_audio_duration(
    file: BinaryIO,
    file_format: AudioFileFormat,
) -> int:
    """
    Gets the duration of an audio file in milliseconds.

    :raises BusinessLogicError: If the file format is not supported.
    :raises ValidationError: If the duration cannot be read.
    """
    metadata_class: type[MP3 | OggVorbis | WAVE]
    match file_format:
        case AudioFileFormat.MP3:
            metadata_class = MP3
        case AudioFileFormat.OGG:
            metadata_class = OggVorbis
        case AudioFileFormat.WAV:
            metadata_class = WAVE
        case other:
            raise BusinessLogicError(f"Unhandled file format: {other}")

    try:
        metadata = metadata_class(file)
    except MutagenError as exc:
        raise ValidationError("Failed to read metadata") from exc

    if metadata is None or metadata.info is None:
        raise ValidationError("No metadata found")

    return int(metadata.info.length * 1000)


def clip_audio_file(
    file: BinaryIO,
    file_format: AudioFileFormat,
    *,
    start: int,
    end: int,
) -> BinaryIO:
    """
    Clips an audio file from `start` to `end` in milliseconds.

    :raises ValidationError: If the start or end times are invalid,
        or if the file is empty.
    """
    if start < 0:
        raise ValidationError("Start cannot be negative")

    if end <= start:
        raise ValidationError("Start must be less than end")

    if file_format not in AudioFileFormat:
        raise ValidationError(f"Unsupported file format: {file_format}")

    file.seek(0, 2)
    if file.tell() == 0:
        raise ValidationError("Cannot clip an empty file")
    file.seek(0)

    audio_segment = AudioSegment.from_file(file, format=file_format)
    clipped_segment = audio_segment[start:end]
    temp_file = TemporaryFile(mode="wb+")
    clipped_segment.export(temp_file, format=file_format)
    temp_file.seek(0)
    return temp_file


def get_file_size(file: BinaryIO) -> int:
    """
    Gets the size of an audio file in bytes.
    """
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size


def get_audio_mime_type(file_format: AudioFileFormat) -> AudioMimeType:
    """
    Returns the MIME type for a given audio file format.

    :raises BusinessLogicError: If the file format is not supported.
    """
    match file_format:
        case AudioFileFormat.MP3:
            return AudioMimeType.MP3
        case AudioFileFormat.OGG:
            return AudioMimeType.OGG
        case AudioFileFormat.WAV:
            return AudioMimeType.WAV
        case _:
            raise BusinessLogicError(f"Unsupported file format: {file_format}")
