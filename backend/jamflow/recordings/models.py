from datetime import date
from enum import StrEnum

from pydantic import UUID4
from sqlmodel import Field

from jamflow.infra.database.models import BaseSQLModel, str_enum_to_sa_column


class AudioFileFormat(StrEnum):
    MP3 = "mp3"
    WAV = "wav"
    OGG = "ogg"

    @property
    def mime_type(self) -> str:
        match self:
            case self.MP3:
                return "audio/mpeg"
            case self.WAV:
                return "audio/wav"
            case self.OGG:
                return "audio/ogg"
            case other:
                raise ValueError(f"Missing mime_type mapping for {other}")


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int  # in milliseconds
    format: AudioFileFormat = Field(
        sa_column=str_enum_to_sa_column(AudioFileFormat, nullable=False)
    )
    size: int  # in bytes
    path: str
    recorded_date: date | None


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
