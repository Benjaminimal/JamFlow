from datetime import datetime
from typing import Self

from pydantic import UUID4, BaseModel, HttpUrl, NonNegativeInt, model_validator

from jamflow.models.enums import AudioFileFormat
from jamflow.schemas.types import NonBlankBoundedString


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
