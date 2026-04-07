from datetime import date, datetime
from typing import Annotated, Self

from fastapi import File, Form, UploadFile
from pydantic import (
    UUID4,
    AfterValidator,
    BaseModel,
    BeforeValidator,
    HttpUrl,
    NonNegativeInt,
    model_validator,
)

from jamflow.core.models import AudioFileFormat
from jamflow.core.validators import NonBlankBoundedString, empty_string_to_none
from jamflow.recordings.validators import (
    get_file_size_validator,
    validate_audo_file_format,
)

MAX_UPLOAD_FILE_SIZE = 200 * 1024 * 1024  # 200 MB


# TODO: make this depend less on the view details
class TrackCreateDto(BaseModel):
    title: NonBlankBoundedString = Form(...)
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
    url: HttpUrl


class TrackSignedUrlDto(BaseModel):
    track_id: UUID4
    url: str
    expires_at: datetime


class ClipCreateDto(BaseModel):
    title: NonBlankBoundedString
    track_id: UUID4
    start: NonNegativeInt  # in milliseconds
    end: NonNegativeInt  # in milliseconds

    @model_validator(mode="after")
    def validate_start_end(self) -> Self:
        if self.start >= self.end:
            raise ValueError("Start must be less than end")
        return self


class ClipReadDto(BaseModel, from_attributes=True):
    id: UUID4
    title: str
    track_id: UUID4
    duration: int  # in milliseconds
    start: int  # in milliseconds
    end: int  # in milliseconds
    created_at: datetime
    updated_at: datetime
    format: AudioFileFormat
    size: int  # in bytes
    url: HttpUrl
