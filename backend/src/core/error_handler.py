from fastapi import Request
from fastapi.responses import JSONResponse
from .exceptions import ApplicationException
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)


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
            "name": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "statusCode": 500,
            "errors": [str(exc)],
        },
    )
