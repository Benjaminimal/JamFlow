from collections.abc import Callable

from fastapi import UploadFile

from jamflow.core.exceptions import ValidationError
from jamflow.models.enums import AudioFileFormat
from jamflow.services.audio import get_audio_file_format


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
    Validates that a file is an audio file of an accepted format.
    """
    try:
        get_audio_file_format(upload_file.file)
    except ValidationError as exc:
        # TODO: Unsure if we shnould remap to ValueError or just let it bubble up
        raise ValueError(
            f"Unsupported file format. Supported formats: {', '.join(AudioFileFormat)}"
        ) from exc
    return upload_file


# TODO: should we use our custom ValidationError here?
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
