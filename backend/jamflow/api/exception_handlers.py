from fastapi import Request, Response, status
from fastapi.exceptions import HTTPException, RequestValidationError
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

_API_STATUS_CODE_MAP = {
    status.HTTP_400_BAD_REQUEST: ErrorCode.VALIDATION_ERROR,
    status.HTTP_401_UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN: ErrorCode.FORBIDDEN,
    status.HTTP_404_NOT_FOUND: ErrorCode.NOT_FOUND,
    status.HTTP_422_UNPROCESSABLE_ENTITY: ErrorCode.BUSINESS_RULE_VIOLATION,
    status.HTTP_409_CONFLICT: ErrorCode.CONFLICT,
    status.HTTP_429_TOO_MANY_REQUESTS: ErrorCode.RATE_LIMITED,
    status.HTTP_500_INTERNAL_SERVER_ERROR: ErrorCode.INTERNAL_ERROR,
}


async def application_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ApplicationError,
) -> Response:
    """
    Map exceptions directly raised by the application to HTTP responses.
    """
    exec_type = type(exc)
    status_code = get_http_status(exec_type)
    error_code = get_error_code(status_code)

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


async def fast_api_validation_exception_handler(
    request: Request,  # noqa: ARG001
    exc: RequestValidationError,
) -> Response:
    """
    Map Exceptions raised by FastAPI request validation to HTTP responses.
    """
    details = []
    for error in exc.errors():
        error_detail_kwargs = {
            "message": error.get("msg", "Validation error"),
        }

        loc = error.get("loc", [])
        if len(loc) > 1:
            field = loc[-1]
            if field is not None:
                error_detail_kwargs["field"] = field

        details.append(ErrorDetailDto(**error_detail_kwargs))

    error_content = ApiErrorDto(
        code=ErrorCode.VALIDATION_ERROR,
        details=details,
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=error_content.model_dump(exclude_none=True),
    )

    pass


async def fast_api_http_exception_handler(
    request: Request,  # noqa: ARG001
    exc: HTTPException,
) -> Response:
    """
    Map generic HTTP exceptions raised by FastAPI to HTTP responses.
    """
    error_code = get_error_code(exc.status_code)

    error_content = ApiErrorDto(
        code=error_code,
        details=[ErrorDetailDto(message=exc.detail)],
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_content.model_dump(exclude_none=True),
    )


async def external_exception_handler(
    request: Request,  # noqa: ARG001
    exc: Exception,
) -> Response:
    """
    Map library raised or unhandled exceptions to HTTP responses.
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


def page_not_found_handler(
    request: Request,  # noqa: ARG001
    exc: HTTPException,  # noqa: ARG001
) -> Response:
    """
    Map HTTP 404 Not Found errors to the custom error response format.
    """
    error_content = ApiErrorDto(
        code=ErrorCode.NOT_FOUND,
        details=[ErrorDetailDto(message="Endpoint not found")],
    )

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=error_content.model_dump(exclude_none=True),
    )


def get_http_status(exec_type: type[ApplicationError]) -> int:
    """
    Get the HTTP status code for a given application error type.

    :rasises KeyError: If no status code is registered for the error type.
    """
    return _APP_ERROR_HTTP_STATUS_MAP[exec_type]


def get_error_code(status_code: int) -> ErrorCode:
    """
    Get the API error code for a given http status code.

    :raises KeyError: If no error code is registered for the status code.
    """
    return _API_STATUS_CODE_MAP[status_code]
