from datetime import date

from sqlmodel import Field

from .base import BaseSQLModel
from .enums import AudioFileFormat, str_enum_to_sa_column


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int  # in milliseconds
    format: AudioFileFormat = Field(
        sa_column=str_enum_to_sa_column(AudioFileFormat, nullable=False)
    )
    size: int  # in bytes
    path: str
    recorded_date: date | None
