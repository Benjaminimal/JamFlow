import enum

from pydantic import BaseModel, Field

from jamflow.utils import timezone_now


@enum.unique
class ErrorCode(enum.StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorDetailDto(BaseModel):
    message: str
    field: str | None = None


# TODO: document this via OpenAPI
class ApiErrorDto(BaseModel):
    code: ErrorCode
    details: list[ErrorDetailDto]
    timestamp: str = Field(default_factory=lambda: timezone_now().isoformat())
