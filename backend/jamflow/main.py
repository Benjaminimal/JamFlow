from fastapi import FastAPI

from jamflow.api import router as api_router
from jamflow.api.exception_handlers import (
    application_exception_handler,
    conflict_exception_handler,
    resource_not_found_exception_handler,
    validation_exception_handler,
)
from jamflow.core.exceptions import (
    ApplicationError,
    DataIntegrityError,
    ResourceNotFoundError,
    ValidationError,
)
from jamflow.core.middlewares import request_bind_log_context_middleware

app = FastAPI()

app.middleware("http")(request_bind_log_context_middleware)

app.exception_handler(ApplicationError)(application_exception_handler)
app.exception_handler(ValidationError)(validation_exception_handler)
app.exception_handler(ResourceNotFoundError)(resource_not_found_exception_handler)
app.exception_handler(DataIntegrityError)(conflict_exception_handler)

app.include_router(api_router)
