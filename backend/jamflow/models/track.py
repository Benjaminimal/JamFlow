from datetime import date

from sqlmodel import Field

from .base import BaseSQLModel
from .enums import AudioFileFormat


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int  # in milliseconds
    format: AudioFileFormat
    size: int  # in bytes
    path: str
    recorded_date: date | None
