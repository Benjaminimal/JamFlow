class ApplicationException(Exception):
    """Base class for all exceptions in the application."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
