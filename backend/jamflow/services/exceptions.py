class ServiceException(Exception):
    """Base exception class for service errors."""

    def __init__(self, message: str):
        super().__init__(message)
