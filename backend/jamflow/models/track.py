from datetime import date

from sqlmodel import Field

from .base import BaseSQLModel
from .enums import AudioFileFormat


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int
    recorded_date: date | None
    file_format: AudioFileFormat
    file_size: int
    file_path: str
