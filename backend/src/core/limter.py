from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from .config import IP_MEMORY

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=IP_MEMORY  # memory locally, Redis in production
)