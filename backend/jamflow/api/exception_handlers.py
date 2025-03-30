from fastapi import Request, Response, status
from fastapi.responses import JSONResponse

from jamflow.core.exceptions import ApplicationException
from jamflow.services.exceptions import (
    ConflictException,
    ResourceNotFoundException,
    ValidationException,
)


async def application_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ApplicationException,
) -> Response:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "msg": exc.message,
            },
        },
    )


async def validation_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ValidationException,
) -> Response:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": {
                "msg": exc.message,
                "field": exc.field,
            },
        },
    )


async def resource_not_found_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ResourceNotFoundException,
) -> Response:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": {
                "msg": exc.message,
            },
        },
    )


async def conflict_exception_handler(
    request: Request,  # noqa: ARG001
    exc: ConflictException,
) -> Response:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": {
                "msg": exc.message,
            },
        },
    )
