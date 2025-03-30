from datetime import date

from sqlmodel import Field

from .base import BaseSQLModel
from .enums import AudioFileFormat


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int  # in milliseconds
    recorded_date: date | None
    # TODO: remove file_ prefix
    file_format: AudioFileFormat
    file_size: int  # in bytes
    file_path: str
