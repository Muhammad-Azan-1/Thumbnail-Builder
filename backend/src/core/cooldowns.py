import hashlib
import json
import logging
import math
from datetime import datetime, timezone

from redis.asyncio import Redis

from .config import REDIS_URL

logger = logging.getLogger(__name__)
_PREFIX = "thumbnail-builder:cooldowns:v1"


class CooldownStoreUnavailable(RuntimeError):
    pass


class RateLimitCooldownStore:

    #* Create the Redis client when CooldownStore is instantiated.
    # Redis will establish the network connection only when an operation runs.
    def __init__(self) -> None:
        self._redis = Redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else None

    #* Check that Redis is reachable, or warn when it's not.
    async def verify_connection(self) -> None:
        logger.info(f"verify connection function called")
        if self._redis is None:
            logger.warning("REDIS_URL is unset; cooldowns are unavailable and rate limits are worker-local")
            return
        # sends the Redis PING command over the network and waits for the PONG response.
        await self._redis.ping()

    #* Close the Redis connection when the FastAPI application shuts down.
    async def close(self) -> None:
        logger.info(f"close function called")
        if self._redis is not None:
            await self._redis.aclose()


    #* Save a single cooldown record for one identity, scope, and action until it expires.
    # basically this function runs when redis hit rate limit error and it will 
    # store the record for that user who just hit rate limit error unless and until the
    # record expires , once the record expire then the user can hit the api again
    async def record(self, identity: str, scope: str, action: str, expires_at: datetime ) -> None:
        logger.info(f"record function called")
        redis = self._require_redis()
        expires_at = expires_at.astimezone(timezone.utc)

        # TTL is how many seconds Redis should keep this cooldown record.
        ttl = max(1, math.ceil((expires_at - datetime.now(timezone.utc)).total_seconds()))

        identity_key = _hash(identity)
        action_key = _hash(scope + "\0" + action)
        record_key = f"{_PREFIX}:{identity_key}:{action_key}"
        record = {
            "identity": identity,
            "scope": scope,
            "action": action,
            "expires_at": expires_at.isoformat(),
        }
        await redis.set(record_key, json.dumps(record), ex=ttl)

    #* Find every unexpired cooldown belonging to the given identities.
    # basically this function will return the cooldown record for the user who hit rate limit error
    # for the supplied identities
    async def get_active(self, identities: list[str]) -> list[dict[str, str]]:
        logger.info(f"get_active function called")
        redis = self._require_redis()
        found: dict[tuple[str, str], dict[str, str]] = {}
        now = datetime.now(timezone.utc)

        for identity in dict.fromkeys(identities):
            pattern = f"{_PREFIX}:{_hash(identity)}:*"
            async for key in redis.scan_iter(match=pattern):
                value = await redis.get(key)
                if value is None:
                    continue
                record = json.loads(value)

                #*Only records for the requested identity that expire in the future are kept.
                if record["identity"] != identity:
                    continue
                expires_at = datetime.fromisoformat(record["expires_at"])
                if expires_at <= now:
                    continue
                item = {
                    "scope": record["scope"],
                    "action": record["action"],
                    "expires_at": expires_at.isoformat(),
                }
                key = (item["scope"], item["action"])
                if key not in found or found[key]["expires_at"] < item["expires_at"]:
                    found[key] = item

        return sorted(found.values(), key=lambda item: (item["scope"], item["action"]))


    #* Limit how often one IP can request to check cooldown-status from redis within a 60-second window.
    async def check_status_rate_limit(self, client_ip: str) -> int | None:
        logger.info("check_status_rate_limit function called")
        redis = self._require_redis()
        key = f"{_PREFIX}:status:{_hash(client_ip)}"
        count = await redis.incr(key) # It increments that IP’s request counter in redis store

        if count == 1:  # On the first request, it sets the counter to expire after 60 seconds:
            await redis.expire(key, 60)
        if count > 30: # if the counter exceeds 30, it returns a 429 Too Many Requests error. with the remaning time left for window reset
            return max(1, await redis.ttl(key))
        return None

    def _require_redis(self) -> Redis:
        logger.info("require redis function called")
        # Return the Redis client or clearly report that cooldown storage is unavailable.
        if self._redis is None:
            raise CooldownStoreUnavailable("REDIS_URL is not configured")
        return self._redis


def _hash(value: str) -> str:
    # Convert text into a fixed-length, safe Redis key component.
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


rate_limiter_cooldown_store = RateLimitCooldownStore()
