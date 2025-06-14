import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from jamflow.core.log import bind_log_context, clear_log_context, get_logger

log = get_logger()


async def request_bind_log_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """
    Log the request and bind related information to the log context.
    """
    clear_log_context()
    bind_log_context(
        request_id=str(uuid.uuid4()),
        method=request.method,
        path=request.url.path,
    )
    await log.ainfo("Request received")

    response = await call_next(request)

    await log.ainfo("Request processed", status_code=response.status_code)
    return response
