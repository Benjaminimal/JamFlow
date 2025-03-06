from datetime import date

from sqlmodel import Field  # pyright: ignore [reportUnknownVariableType]

from .base import BaseSQLModel
from .enums import FileFormat


class Track(BaseSQLModel, table=True):
    title: str = Field(max_length=255)
    duration: int
    recorded_date: date | None
    file_format: FileFormat
    file_size: int
    file_path: str
