from fastapi import FastAPI

from jamflow.api import router as api_router
from jamflow.api.exception_handlers import (
    application_exception_handler,
    conflict_exception_handler,
    resource_not_found_exception_handler,
    validation_exception_handler,
)
from jamflow.core.exceptions import ApplicationException
from jamflow.core.middlewares import request_bind_log_context_middleware
from jamflow.services.exceptions import (
    ConflictException,
    ResourceNotFoundException,
    ValidationException,
)

app = FastAPI()

app.middleware("http")(request_bind_log_context_middleware)

app.exception_handler(ApplicationException)(application_exception_handler)
app.exception_handler(ValidationException)(validation_exception_handler)
app.exception_handler(ResourceNotFoundException)(resource_not_found_exception_handler)
app.exception_handler(ConflictException)(conflict_exception_handler)

app.include_router(api_router)
