from pydantic import UUID4
from sqlmodel import Field

from jamflow.models.enums import AudioFileFormat

from .base import BaseSQLModel


class Clip(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    track_id: UUID4 = Field(foreign_key="track.id", index=True)
    start: int  # in milliseconds
    end: int  # in milliseconds
    format: AudioFileFormat
    size: int  # in bytes
    path: str
