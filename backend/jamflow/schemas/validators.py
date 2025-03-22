from collections.abc import Callable
from pathlib import Path

from fastapi import UploadFile

from jamflow.models.enums import AudioFileFormat


def empty_string_to_none(value: str | None) -> str | None:
    """
    This validator can be used in the `BeforeValidator` to ensure that
    empty strings are converted to `None` before validation.
    A use case could be for ommited or null form fields (multipart/form-data)
    as FastAPI treats them as empty strings ("") instead of None.
    """
    return None if value == "" else value


def validate_audo_file_format(upload_file: UploadFile) -> UploadFile:
    """
    Validates that a file is an audio file.
    """
    if not upload_file.filename:
        raise ValueError("File name is empty")

    # TODO: look at the actual file to find the file format
    file_extension = Path(upload_file.filename).suffix.replace(".", "", count=1)
    file_format = file_extension.upper()
    if file_format not in AudioFileFormat:
        raise ValueError(
            f"File format '{file_format}' not supported. Supported formats: {', '.join(AudioFileFormat)}"
        )

    return upload_file


def get_file_size_validator(max_size: int) -> Callable[[UploadFile], UploadFile]:
    """
    Returns a file size validator with a specific max size.
    """

    def validate_file_size(upload_file: UploadFile) -> UploadFile:
        if not upload_file.size:
            raise ValueError("File is empty")

        if upload_file.size > max_size:
            raise ValueError(f"File is larger than {max_size // (1024 * 1024)} MB")

        return upload_file

    return validate_file_size
