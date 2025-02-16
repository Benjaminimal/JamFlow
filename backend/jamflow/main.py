from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

from jamflow.core.config import settings
from jamflow.core.log import bind_log_context, clear_log_context, get_logger

app = FastAPI()

log = get_logger()


@app.middleware("http")
async def request_bind_log_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """
    Log the request and bind related information to the log context.
    """
    clear_log_context()
    bind_log_context(method=request.method, path=request.url.path)

    response = await call_next(request)

    await log.ainfo("Request processed", status_code=response.status_code)
    return response


@app.get("/")
async def read_root():
    return {"message": f"Hello World. Welcome to {settings.PROJECT_NAME}!"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
