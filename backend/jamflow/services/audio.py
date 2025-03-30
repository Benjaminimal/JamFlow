from pathlib import PurePath
from typing import BinaryIO

import filetype  # type: ignore [import-untyped]
from mutagen import MutagenError  # type: ignore [attr-defined]
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE

from jamflow.core.log import get_logger
from jamflow.models.enums import AudioFileFormat
from jamflow.services.exceptions.base import ServiceException

log = get_logger()


def get_audio_file_format(
    file: str | bytes | bytearray | PurePath | BinaryIO,
) -> AudioFileFormat:
    """
    Guesses the file type of an audio file.

    :raises ServiceException: If the file type cannot be guessed or is not supported.
    """
    kind = filetype.guess(file)
    if kind is None:
        log.error("Failed to guess file type")
        # TODO: use more specific exception
        raise ServiceException("Cannot guess file type")
    extension = kind.extension.upper()
    if extension not in AudioFileFormat:
        log.error("Unsupported file type detected", file_type=extension)
        # TODO: use more specific exception
        raise ServiceException(f"Unsupported file type: {extension}")
    return AudioFileFormat(extension)


def get_audio_duration(
    file: str | BinaryIO,
    file_format: AudioFileFormat,
) -> int:
    """
    Gets the duration of an audio file in milliseconds.
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
            log.error("Unhandled file format", file_format=other)
            raise ServiceException(f"Unhandled file format: {other}")

    try:
        metadata = metadata_class(file)
    except MutagenError as exc:
        log.error("Failed to read metadata", exc_info=True)
        # TODO: use more specific exception
        raise ServiceException("Failed to read metadata") from exc

    if metadata is None or metadata.info is None:
        log.error("No metadata found")
        # TODO: use more specific exception
        raise ServiceException("No metadata found")

    return int(metadata.info.length * 1000)
