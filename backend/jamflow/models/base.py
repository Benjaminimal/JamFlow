import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel  # pyright: ignore [reportUnknownVariableType]

from jamflow.utils import timezone_now


class BaseSQLModel(SQLModel):
    """Base class for models that have a UUID primary key and timestamps."""

    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=timezone_now)
    updated_at: datetime = Field(
        default_factory=timezone_now, sa_column_kwargs={"onupdate": timezone_now}
    )

    def __repr__(self):
        return f"<{self.__class__.__name__} id={self.id}>"
