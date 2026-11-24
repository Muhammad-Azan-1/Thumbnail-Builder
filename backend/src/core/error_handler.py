from fastapi import Request
from fastapi.responses import JSONResponse
from .exceptions import ApplicationException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging

logger = logging.getLogger(__name__)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Include the violated limit's scope so the frontend can cooldown the right actions."""
    response = _rate_limit_exceeded_handler(request, exc)
    response.headers["X-RateLimit-Scope"] = (
        "application" if exc.limit.scope == "global" else "route"
    )
    return response


async def application_exception_handler(request: Request, exc: ApplicationException):
    """
    Global handler for ApplicationException.
    Register with: app.add_exception_handler(ApplicationException, application_exception_handler)

    Builds a consistent JSON error response from the exception's fields.
    """
    logger.exception(
    f"handled exception on {request.method} {request.url.path}"
    )
    return JSONResponse(
        status_code=exc.statusCode,
        content={
            "success": False,
            "name": exc.name,
            "message": exc.message,
            "statusCode": exc.statusCode,
            "errors": exc.errors,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for any unhandled exception that is NOT an ApplicationException.
    Prevents raw tracebacks from leaking to the frontend.
    """
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "name": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "statusCode": 500,
            "errors": [str(exc)],
        },
    )


# For invalid request fields, Pydantic detects the validation problem, and FastAPI normally turns it into an HTTP 422 response with a "detail" array. Your app hasn’t registered a custom handler for that validation error, so FastAPI’s default response is used.