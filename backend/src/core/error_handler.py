from datetime import datetime, timedelta, timezone
import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from .exceptions import ApplicationException, CooldownStatusRateLimitException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from redis.exceptions import RedisError

from .cooldowns import CooldownStoreUnavailable, cooldown_store

logger = logging.getLogger(__name__)


# request: the original HTTP request
# exc: the limit object and 429 exception details

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Include the violated limit's scope so the frontend can cooldown the right actions."""
    response = _rate_limit_exceeded_handler(request, exc)
    scope = "application" if exc.limit.scope == "global" else "route"
    response.headers["X-RateLimit-Scope"] = scope

    retry_after = response.headers.get("Retry-After")
    if retry_after is None:
        logger.error("Rate limit response did not include a Retry-After header")
        response.headers["X-Cooldown-Status"] = "unavailable"
        return response
    try:
        retry_seconds = int(retry_after)
    except ValueError:
        logger.error("Rate limit response included an invalid Retry-After header")
        response.headers["X-Cooldown-Status"] = "unavailable"
        return response
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=max(0, retry_seconds))

    identity = exc.limit.key_func(request)
    route = request.scope.get("route")
    route_path = getattr(route, "path", request.url.path)
    action = "application" if scope == "application" else f"{request.method} {route_path}"

    try:
        await cooldown_store.record(
            identity=identity,
            scope=scope,
            action=action,
            expires_at=expires_at,
        )
    except CooldownStoreUnavailable:
        logger.error("Cooldown record was not saved because REDIS_URL is not configured")
        response.headers["X-Cooldown-Status"] = "unavailable"
    except RedisError:
        logger.exception("Cooldown record was not saved because Redis is unavailable")
        response.headers["X-Cooldown-Status"] = "unavailable"
    else:
        response.headers["X-Cooldown-Status"] = "stored"

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
    response = JSONResponse(
        status_code=exc.statusCode,
        content={
            "success": False,
            "name": exc.name,
            "message": exc.message,
            "statusCode": exc.statusCode,
            "errors": exc.errors,
        },
    )
    
    if isinstance(exc, CooldownStatusRateLimitException):
        response.headers["Retry-After"] = str(exc.retry_after)
    return response


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