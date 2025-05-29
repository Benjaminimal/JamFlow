from tempfile import TemporaryFile
from typing import BinaryIO

import filetype  # type: ignore [import-untyped]
from mutagen import MutagenError  # type: ignore [attr-defined]
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE
from pydub import AudioSegment

from jamflow.core.log import get_logger
from jamflow.models.enums import AudioFileFormat
from jamflow.services.exceptions import ServiceException

log = get_logger()


# TODO: might narrow file type to BinaryIO as we rarely write to disk


class AudioServiceException(ServiceException):
    pass


def get_audio_file_format(
    file: str | BinaryIO,
) -> AudioFileFormat:
    """
    Guesses the file type of an audio file.

    :raises AudioServiceException: If the file type cannot be guessed or is not supported.
    """
    kind = filetype.guess(file)
    if kind is None:
        log.error("Failed to guess file type")
        raise AudioServiceException("Cannot guess file type")
    extension = kind.extension.upper()
    if extension not in AudioFileFormat:
        log.error("Unsupported file type detected", file_type=extension)
        raise AudioServiceException(f"Unsupported file type: {extension}")
    return AudioFileFormat(extension)


def get_audio_duration(
    file: str | BinaryIO,
    file_format: AudioFileFormat,
) -> int:
    """
    Gets the duration of an audio file in milliseconds.

    :raises AudioServiceException: If the duration cannot be read.
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
        raise AudioServiceException("Failed to read metadata") from exc

    if metadata is None or metadata.info is None:
        log.error("No metadata found")
        raise AudioServiceException("No metadata found")

    return int(metadata.info.length * 1000)


# TODO: needs testing
def clip_audio_file(
    file: str | BinaryIO,
    file_format: AudioFileFormat,
    *,
    start: int,
    end: int,
) -> BinaryIO:
    """
    Clips an audio file from `start` to `end` in milliseconds.
    """
    audio_segment = AudioSegment.from_file(file, format=file_format.lower())
    clipped_segment = audio_segment[start:end]
    temp_file = TemporaryFile(mode="wb+")
    clipped_segment.export(temp_file, format=file_format.lower())
    temp_file.seek(0)
    return temp_file


# TODO: needs testing
def get_file_size(file: BinaryIO) -> int:
    """
    Gets the size of an audio file in bytes.
    """
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size
