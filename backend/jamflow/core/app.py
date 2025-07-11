from fastapi import FastAPI, status
from fastapi.exceptions import HTTPException, RequestValidationError

from jamflow.api import router as api_router
from jamflow.api.exception_handlers import (
    application_exception_handler,
    external_exception_handler,
    fast_api_http_exception_handler,
    fast_api_validation_exception_handler,
    page_not_found_handler,
)
from jamflow.core.exceptions import ApplicationError
from jamflow.core.log import configure_logging
from jamflow.core.middlewares import (
    request_bind_log_context_middleware,
    request_id_middleware,
)


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    """
    configure_logging()

    app = FastAPI()

    app.middleware("http")(request_bind_log_context_middleware)
    app.middleware("http")(request_id_middleware)

    app.exception_handler(ApplicationError)(application_exception_handler)
    app.exception_handler(RequestValidationError)(fast_api_validation_exception_handler)
    app.exception_handler(HTTPException)(fast_api_http_exception_handler)
    app.exception_handler(Exception)(external_exception_handler)
    app.add_exception_handler(status.HTTP_404_NOT_FOUND, page_not_found_handler)

    app.include_router(api_router)

    return app
