from datetime import date, datetime
from typing import Annotated

from fastapi import File, Form, UploadFile
from pydantic import UUID4, BaseModel, StringConstraints, field_validator

from jamflow.models.enums import FileFormat


class TrackCreateDto(BaseModel):
    title: Annotated[
        str,
        StringConstraints(strip_whitespace=True, max_length=255),
    ] = Form(...)
    recorded_date: date | None = Form(None)
    upload_file: UploadFile = File(...)

    @field_validator("recorded_date", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: str | None) -> str | None:
        """
        FastAPI treats omitted or null form fields (multipart/form-data)
        as empty strings ("") instead of None. Since Pydantic expects
        `recorded_date` to be a `date` or `None`, we need to convert
        empty strings to `None` before validation.
        """
        return None if value == "" else value


class TrackReadDto(BaseModel, from_attributes=True):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    title: str
    duration: int
    recorded_date: date | None
    file_format: FileFormat
    file_size: int
