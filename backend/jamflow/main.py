from fastapi import FastAPI

from jamflow.api import router as api_router
from jamflow.api.exception_handlers import (
    application_exception_handler,
    external_exception_handler,
)
from jamflow.core.exceptions import ApplicationError
from jamflow.core.middlewares import (
    request_bind_log_context_middleware,
    request_id_middleware,
)

app = FastAPI()

app.middleware("http")(request_bind_log_context_middleware)
app.middleware("http")(request_id_middleware)

app.add_exception_handler(ApplicationError, application_exception_handler)
app.add_exception_handler(Exception, external_exception_handler)

app.include_router(api_router)
