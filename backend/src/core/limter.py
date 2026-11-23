from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from .config import IP_MEMORY
import jwt
from .config import ACCESS_TOKEN_SECRET , ALOGRITHEM
from fastapi.security import OAuth2PasswordBearer

#? Implementing Account based Rate Limiter and IP based Rate Limiter
# - If user is logged-IN then the rate Limiter  applied on them will be Account based (we track them from there Account how many request this account has made in X time for X route)
# - If user is not logged-IN or Logged-IN but we are enable to get them then the rate Limiter  applied on them will be IP based (we track them from there IP how many request this IP
#  has made in X time for X route


# This function will always be called with the request parameter, when it called by anyone either by slowAPI middleware or by any route
def get_rate_limit_key(request: Request) -> str:
    cached = getattr(request.state, "rate_limit_key", None)
    if cached: # only for the current request that has been made
        return cached

    key = None
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]

    if token:
        try:
            payload = jwt.decode(token, ACCESS_TOKEN_SECRET, algorithms=[ALOGRITHEM])
            if payload.get("user_id"):
                key = f"user:{payload['user_id']}"
                print(f"Rate limiter applied to the user with key : {key} based  on their account")
        except jwt.PyJWTError:
            pass  # invalid or expired token = treat as anonymous request

    key = key or f"ip:{get_remote_address(request)}"
    print(f"Rate limiter applied to the user with key : {key} based  on their IP")
    request.state.rate_limit_key = key
    return key

limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["50/minute"],
    application_limits=['100/minute'],
    storage_uri=IP_MEMORY  # memory locally, Redis in production
)



#? Important notes about rate limit

#* --- ?

#* 1) default_limits : A fallback limit for each route that has no @limiter.limit(...) decorator. It is not one shared counter for the whole application.
    #? default_limits=["50/minute"]

#* 2) application_limits : A shared limit across all routes, per client key. With get_remote_address, all requests from one IP/account count toward the same application-limit counter.
   #? application_limits=["100/minute"]

#* 3) Route-level decorator : A limit for one specific route:
    #? @limiter.limit("5/minute")
    #? async def signup(request: Request):

#* note : The route needs a Request parameter. By default, its specific limit replaces default_limits for that route. Set override_defaults=False if you want both the default and route-specific limits to apply.



#* --- ?

# Each non-decorated route has a default limit of 50 requests/minute per IP.
# A decorated route uses its decorator's limit; by default, this replaces the default limit.
# application_limits=["100/minute"] caps all routes combined at 100 requests/minute per IP.

#* ----?

#? what is Infrastructure-level rate limiting?

# Yes, many production FastAPI and Starlette applications use SlowAPI for application-level 
# rate limiting, provided it is configured with a distributed backend like Redis.
#  However, high-scale systems often pair or replace it with infrastructure-level rate 
# limiting at the API gateway or edge.

# Infrastructure-level rate limiting is separate: an API gateway, 
# reverse proxy, or edge service checks and blocks requests before they reach FastAPI (server).

#* ----?