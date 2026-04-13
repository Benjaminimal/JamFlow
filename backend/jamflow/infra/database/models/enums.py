from enum import StrEnum
from typing import Any

from sqlalchemy import Enum as SQLEnum
from sqlmodel import Column


def str_enum_to_sa_column(
    str_enum: type[StrEnum], **enum_kwargs: Any
) -> Column[SQLEnum]:
    """
    Convert a StrEnum to a SQLAlchemy Enum column while using the StrEnum values.

    This is needed because SQLModel uses the property name.
    """
    return Column(
        SQLEnum(
            str_enum,
            name=str_enum.__name__.lower(),
            values_callable=lambda e: [str(v) for v in e],
        ),
        **enum_kwargs,
    )
