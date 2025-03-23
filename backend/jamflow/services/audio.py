from pathlib import PurePath
from typing import BinaryIO

import filetype  # type: ignore [import-untyped]

from jamflow.models.enums import AudioFileFormat
from jamflow.services.exceptions.base import ServiceException


def get_audio_file_format(
    file: str | bytes | bytearray | PurePath | BinaryIO,
) -> AudioFileFormat:
    """
    Guesses the file type of an audio file.

    :raises ServiceException: If the file type cannot be guessed or is not supported.
    """
    kind = filetype.guess(file)
    if kind is None:
        # TODO: use more specific exception
        raise ServiceException("Cannot guess file type")
    extension = kind.extension.upper()
    if extension not in AudioFileFormat:
        # TODO: use more specific exception
        raise ServiceException(f"Unsupported file type: {extension}")
    return AudioFileFormat(extension)
