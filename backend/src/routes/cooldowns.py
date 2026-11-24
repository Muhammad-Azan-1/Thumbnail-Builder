import logging

from fastapi import APIRouter, Request
from redis.exceptions import RedisError
from slowapi.util import get_remote_address

from ..core.cooldowns import CooldownStoreUnavailable, rate_limiter_cooldown_store
from ..core.exceptions import (
    ApplicationException,
    CooldownStatusRateLimitException,
)
from ..core.limter import get_rate_limit_key, limiter
from ..core.response import ApiResponse
from ..schemas.cooldowns import CooldownStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/cooldowntimer' ,  tags=["Rate limits"])


@router.get("/cooldowns", response_model=ApiResponse[list[CooldownStatus]])
@limiter.exempt #* this tells SlowAPI not to apply its normal rate limits to get_cooldowns()—including the configured default or application limits.
async def get_cooldowns(request: Request) -> ApiResponse[list[CooldownStatus]]:
    client_ip = get_remote_address(request)
    identities = [get_rate_limit_key(request), client_ip]

    try:#* this function work as a ratelimiter for this end point it allows only 30 request to this endpoint in 60 seconds
        #* other wise if request as more then 30 with in 60 seconds then ti retunrs the remaning time after which user can request to this endpoint
        retry_after = await rate_limiter_cooldown_store.check_status_rate_limit(client_ip) 
        if retry_after is not None:
            raise CooldownStatusRateLimitException(retry_after=retry_after)
        active_cooldowns = await rate_limiter_cooldown_store.get_active(identities)

    except CooldownStoreUnavailable as exc:
        logger.exception("Redis failed while reading cooldown status")
        raise ApplicationException(
            name="COOLDOWN_STATUS_UNAVAILABLE",
            message="Cooldown status is unavailable because Redis is not configured.",
            statusCode=503,
        ) from exc # from exc means “raise this new exception because of the exception we just caught.”
    
    except RedisError as exc:
        logger.exception("Redis failed while reading cooldown status")
        raise ApplicationException(
            name="COOLDOWN_STATUS_UNAVAILABLE",
            message="Cooldown status is temporarily unavailable.",
            statusCode=503,
        ) from exc

    return ApiResponse(
        message="Active cooldowns retrieved successfully.",
        data=[CooldownStatus.model_validate(item) for item in active_cooldowns],
    )
