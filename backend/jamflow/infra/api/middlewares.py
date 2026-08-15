import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from jamflow.core.log import bind_log_context, clear_log_context, get_logger

logger = get_logger()


async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """
    Make a unique request ID available in the request state and response headers.
    """

    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id

    return response


async def request_bind_log_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """
    Log the request and bind related information to the log context.
    """
    clear_log_context()

    bind_log_context(
        method=request.method,
        path=request.url.path,
    )

    request_id = getattr(request.state, "request_id", None)
    if not request_id:
        await logger.awarning("Request ID not found in request state")
    bind_log_context(request_id=request_id)

    await logger.ainfo("Request received")

    response = await call_next(request)

    await logger.ainfo("Request processed", status_code=response.status_code)
    return response
