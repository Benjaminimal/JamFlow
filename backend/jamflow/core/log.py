import logging
import sys
from typing import Any

import structlog
from structlog import contextvars, dev, processors, stdlib

from jamflow.core.config import settings


def get_logger() -> stdlib.BoundLogger:
    """Get a fresh logger."""
    logger: stdlib.BoundLogger = structlog.get_logger()
    return logger


def clear_log_context() -> None:
    """
    Reset the current log context.
    """
    contextvars.clear_contextvars()


def bind_log_context(**kwargs: Any) -> None:
    """
    Add key-value pairs to the current log context.
    """
    contextvars.bind_contextvars(**kwargs)


def unbind_log_context(*keys: str) -> None:
    """
    Remove keys from the current log context.
    """
    contextvars.unbind_contextvars(*keys)


def configure_logging() -> None:
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=settings.LOG_LEVEL,
    )
    structlog.configure(
        processors=[
            # If log level is too low, abort pipeline and throw away log entry.
            stdlib.filter_by_level,
            # Merge global into local context.
            contextvars.merge_contextvars,
            # Add the name of the logger to event dict.
            stdlib.add_logger_name,
            # Add log level to event dict.
            stdlib.add_log_level,
            # Perform %-style formatting.
            stdlib.PositionalArgumentsFormatter(),
            # Add a timestamp in ISO 8601 format.
            processors.TimeStamper(fmt="iso"),
            # If the "stack_info" key in the event dict is true, remove it and
            # render the current stack trace in the "stack" key.
            processors.StackInfoRenderer(),
            # Choose how to render the exception info
            _get_exec_info_processor(),  # type: ignore [no-untyped-call]
            # If some value is in bytes, decode it to a Unicode str.
            processors.UnicodeDecoder(),
            # Add callsite parameters.
            processors.CallsiteParameterAdder(
                {
                    processors.CallsiteParameter.MODULE,
                    processors.CallsiteParameter.FUNC_NAME,
                    processors.CallsiteParameter.FILENAME,
                    processors.CallsiteParameter.LINENO,
                }
            ),
            # Render the final event dict
            _get_renderer(),
        ],
        # `wrapper_class` is the bound logger that you get back from
        # get_logger(). This one imitates the API of `logging.Logger`.
        wrapper_class=stdlib.BoundLogger,
        # `logger_factory` is used to create wrapped loggers that are used for
        # OUTPUT. This one returns a `logging.Logger`. The final value (a JSON
        # string) from the final processor (`JSONRenderer`) will be passed to
        # the method of the same name as that you've called on the bound logger.
        logger_factory=stdlib.LoggerFactory(),
        # Effectively freeze configuration after creating the first bound
        # logger.
        cache_logger_on_first_use=_should_cache_logger(),
    )


def _get_renderer() -> processors.JSONRenderer | dev.ConsoleRenderer:
    """
    Get the appropriate renderer based on the settings.
    """
    if settings.LOG_JSON:
        return processors.JSONRenderer()
    return dev.ConsoleRenderer()


def _get_exec_info_processor():  # type: ignore [no-untyped-def]
    """
    Get the exception info processor based on the settings.
    """
    if settings.LOG_JSON:
        # If the "exc_info" key in the event dict is either true or a
        # sys.exc_info() tuple, remove "exc_info" and render the exception
        # with traceback into the "exception" key.
        return processors.format_exc_info
    return structlog.dev.set_exc_info


def _should_cache_logger() -> bool:
    """
    Determine if the logger should be cached.
    """
    # TODO: find a cleaner way to detect if we should cache the logger
    return "pytest" not in sys.modules
