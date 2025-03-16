from jamflow.models.enums import FileFormat

from .base import ValidationException


class TitleEmpyException(ValidationException):
    """Raised when a title is empty."""

    def __init__(self) -> None:
        message = "Title is empty"
        super().__init__(message, field="title")


class FileEmpyException(ValidationException):
    """Raised when a file is empty."""

    def __init__(self) -> None:
        message = "File is empty"
        super().__init__(message, field="upload_file")


class FileTooLargeException(ValidationException):
    """Raised when the uploaded file size exceeds the maximum limit."""

    def __init__(self, max_size: int, current_size: int) -> None:
        max_size_mb = max_size / (1024 * 1024)
        current_size_mb = current_size / (1024 * 1024)
        message = (
            f"File size exceeds the maximum limit of {max_size_mb:.2f} MB."
            f" Current size: {current_size_mb:.2f} MB."
        )
        super().__init__(message, field="upload_file")
        self.max_size = max_size
        self.current_size = current_size


class FileNameEmptyException(ValidationException):
    """Raised when no filename is found."""

    def __init__(self) -> None:
        message = "File name is empty"
        super().__init__(message, field="upload_file")


class FileFormatException(ValidationException):
    """Raised when the file format is invalid or not supported."""

    def __init__(self, file_format: str, allowed_formats: list[FileFormat]) -> None:
        message = (
            f"File format '{file_format}' is not allowed."
            f" Allowed formats: {', '.join(allowed_formats)}."
        )
        super().__init__(message, field="upload_file")
        self.file_format = file_format
        self.allowed_formats = allowed_formats
