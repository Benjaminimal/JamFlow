from fastapi import FastAPI

from jamflow.api import router as api_router
from jamflow.core.middlewares import request_bind_log_context_middleware

app = FastAPI()

app.middleware("http")(request_bind_log_context_middleware)

app.include_router(api_router)
