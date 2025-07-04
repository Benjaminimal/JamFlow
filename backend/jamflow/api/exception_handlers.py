from fastapi import Request, Response, status
from fastapi.responses import JSONResponse

from jamflow.core.exceptions import (
    ApplicationError,
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    ConfigurationError,
    DatabaseError,
    DataIntegrityError,
    ExternalServiceError,
    RateLimitError,
    ResourceNotFoundError,
    StorageError,
    ValidationError,
)
from jamflow.core.log import get_logger

log = get_logger()


_APP_ERROR_HTTP_STATUS_MAP = {
    ValidationError: status.HTTP_400_BAD_REQUEST,
    AuthenticationError: status.HTTP_401_UNAUTHORIZED,
    AuthorizationError: status.HTTP_403_FORBIDDEN,
    ResourceNotFoundError: status.HTTP_404_NOT_FOUND,
    BusinessLogicError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    DataIntegrityError: status.HTTP_409_CONFLICT,
    RateLimitError: status.HTTP_429_TOO_MANY_REQUESTS,
    DatabaseError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    ExternalServiceError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    StorageError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    ConfigurationError: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


async def application_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ApplicationError,
) -> Response:
    """
    Handle application-specific self-raised exceptions.
    """
    for error_type, status_code in _APP_ERROR_HTTP_STATUS_MAP.items():
        if isinstance(exc, error_type):
            status_code = status_code
            break

    return JSONResponse(
        status_code=status_code,
        content={
            "detail": {
                "msg": exc.message,
            },
        },
    )


async def external_exception_handler(
    request: Request,  # noqa: ARG001
    exc: Exception,
) -> Response:
    """
    Handle standard library and third-party library exceptions.
    """
    await log.aexception("Unhandled external exception", exec_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "msg": "Internal server error",
            },
        },
    )
