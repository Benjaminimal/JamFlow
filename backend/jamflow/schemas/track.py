from datetime import date, datetime
from typing import Annotated

from fastapi import File, Form, UploadFile
from pydantic import (
    UUID4,
    AfterValidator,
    BaseModel,
    BeforeValidator,
    StringConstraints,
)

from jamflow.models.enums import AudioFileFormat
from jamflow.schemas.validators import (
    empty_string_to_none,
    get_file_size_validator,
    validate_audo_file_format,
)

MAX_UPLOAD_FILE_SIZE = 200 * 1024 * 1024  # 200 MB


class TrackCreateDto(BaseModel):
    title: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=255),
    ] = Form(...)
    recorded_date: Annotated[
        date | None,
        BeforeValidator(empty_string_to_none),
    ] = Form(None)
    upload_file: Annotated[
        UploadFile,
        AfterValidator(get_file_size_validator(MAX_UPLOAD_FILE_SIZE)),
        AfterValidator(validate_audo_file_format),
    ] = File(...)


class TrackReadDto(BaseModel, from_attributes=True):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    title: str
    duration: int  # in milliseconds
    format: AudioFileFormat
    size: int  # in bytes
    recorded_date: date | None


class TrackSignedUrlDto(BaseModel):
    track_id: UUID4
    url: str
    expires_at: datetime


# class TrackSignedUrlQueryParams()
