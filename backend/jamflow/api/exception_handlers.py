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
from jamflow.schemas.error import ApiErrorDto, ErrorCode, ErrorDetailDto

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

_API_ERROR_CODE_MAP = {
    ValidationError: ErrorCode.VALIDATION_ERROR,
    AuthenticationError: ErrorCode.UNAUTHORIZED,
    AuthorizationError: ErrorCode.FORBIDDEN,
    ResourceNotFoundError: ErrorCode.NOT_FOUND,
    BusinessLogicError: ErrorCode.BUSINESS_RULE_VIOLATION,
    DataIntegrityError: ErrorCode.CONFLICT,
    RateLimitError: ErrorCode.RATE_LIMITED,
    DatabaseError: ErrorCode.INTERNAL_ERROR,
    ExternalServiceError: ErrorCode.INTERNAL_ERROR,
    StorageError: ErrorCode.INTERNAL_ERROR,
    ConfigurationError: ErrorCode.INTERNAL_ERROR,
}


async def application_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ApplicationError,
) -> Response:
    """
    Handle application-specific self-raised exceptions.
    """
    exec_type = type(exc)
    status_code = get_http_status(exec_type)
    error_code = get_error_code(exec_type)

    if status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
        await log.aexception("Unhandled application exception", exec_info=exc)

    error_content = ApiErrorDto(
        code=error_code,
        details=[ErrorDetailDto(message=exc.message)],
    )

    return JSONResponse(
        status_code=status_code,
        content=error_content.model_dump(exclude_none=True),
    )


async def external_exception_handler(
    request: Request,  # noqa: ARG001
    exc: Exception,
) -> Response:
    """
    Handle standard library and third-party library exceptions.
    """
    await log.aexception("Unhandled external exception", exec_info=exc)

    error_content = ApiErrorDto(
        code=ErrorCode.INTERNAL_ERROR,
        details=[ErrorDetailDto(message="Internal server error")],
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_content.model_dump(exclude_none=True),
    )


def get_http_status(exec_type: type[ApplicationError]) -> int:
    """
    Get the HTTP status code for a given application error type.

    :rasises KeyError: If no status code is registered for the error type.
    """
    return _APP_ERROR_HTTP_STATUS_MAP[exec_type]


def get_error_code(exec_type: type[ApplicationError]) -> ErrorCode:
    """
    Get the API error code for a given application error type.

    :raises KeyError: If no error code is registered for the error type.
    """
    return _API_ERROR_CODE_MAP[exec_type]
