from pydantic import UUID4
from sqlmodel import Field

from jamflow.models.enums import AudioFileFormat, str_enum_to_sa_column

from .base import BaseSQLModel


class Clip(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    track_id: UUID4 = Field(foreign_key="track.id", index=True)
    duration: int  # in milliseconds
    start: int  # in milliseconds
    end: int  # in milliseconds
    format: AudioFileFormat = Field(
        sa_column=str_enum_to_sa_column(AudioFileFormat, nullable=False)
    )
    size: int  # in bytes
    path: str
