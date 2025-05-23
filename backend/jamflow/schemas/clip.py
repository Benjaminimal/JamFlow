from datetime import datetime

from pydantic import UUID4, BaseModel


class ClipCreateDto(BaseModel):
    title: str
    track_id: UUID4
    start: int  # in milliseconds
    end: int  # in milliseconds


class ClipReadDto(BaseModel, from_attributes=True):
    id: UUID4
    title: str
    track_id: UUID4
    start: int  # in milliseconds
    end: int  # in milliseconds
    created_at: datetime
    updated_at: datetime
