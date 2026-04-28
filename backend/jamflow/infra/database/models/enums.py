from enum import StrEnum

from sqlalchemy import Enum as SAEnum


def str_enum_to_sa_enum(str_enum: type[StrEnum]) -> SAEnum:
    """Convert a `StrEnum` to a `SQLAlchemy` Enum while using the `StrEnum` values.

    This is needed because `SQLModel` uses the property name which would lead
    to different values in the database.
    """
    enum_type = SAEnum(
        str_enum,
        name=str_enum.__name__.lower(),
        values_callable=lambda e: [str(v) for v in e],
    )

    return enum_type
