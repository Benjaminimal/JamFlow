# TODO: remove me
from jamflow.recordings.validators import (  # noqa: F401
    get_file_size_validator,
    validate_audo_file_format,
)


def empty_string_to_none(value: str | None) -> str | None:
    """
    This validator can be used in the `BeforeValidator` to ensure that
    empty strings are converted to `None` before validation.
    A use case could be for ommited or null form fields (multipart/form-data)
    as FastAPI treats them as empty strings ("") instead of None.
    """
    return None if value == "" else value
