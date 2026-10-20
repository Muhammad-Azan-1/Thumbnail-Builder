
#? This file work as a middleware
#? Dependencies run BEFORE the route function. If the dependency raises
#? an error, the route never executes — just like middleware, but scoped
#? to individual routes instead of the whole app.

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
import jwt

from .config import ACCESS_TOKEN_SECRET, ALOGRITHEM
from .exceptions import UnauthorizedException
from ..db.db import get_async_session
from ..models.models import User


# ┌─────────────────────────────────────────────────────────────────────┐
# │                     WHAT IS OAuth2PasswordBearer?                   │
# ├─────────────────────────────────────────────────────────────────────┤
# │                                                                     │
# │  It does TWO things:                                                │
# │                                                                     │
# │  1. EXTRACTS the token from the "Authorization: Bearer <token>"     │
# │     header. That's it — it does NOT validate the token.             │
# │                                                                     │
# │  2. TELLS Swagger UI (the /docs page) where to send login           │
# │     credentials. The `tokenUrl` param adds an "Authorize" button    │
# │     to Swagger so you can test protected routes from the browser.   │
# │                                                                     │
# │  auto_error=False means:                                            │
# │    - If the Authorization header is MISSING, don't raise 401        │
# │      immediately. Instead, return None so we can check the          │
# │      cookie as a fallback.                                          │
# │    - If auto_error was True (default), a missing header would       │
# │      instantly return 401 and we'd never get to check cookies.      │
# │                                                                     │
# │  WHO SENDS TOKENS IN THE HEADER?                                    │
# │    → Swagger UI (/docs page)                                        │
# │    → Postman / Insomnia / Thunder Client                            │
# │    → Mobile apps (React Native, Flutter, Swift)                     │
# │    → Third-party API consumers                                      │
# │                                                                     │
# └─────────────────────────────────────────────────────────────────────┘
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# ┌─────────────────────────────────────────────────────────────────────┐
# │                  WHY DO WE ALSO READ FROM COOKIES?                  │
# ├─────────────────────────────────────────────────────────────────────┤
# │                                                                     │
# │  Our login route sets the access_token as an httpOnly cookie:       │
# │                                                                     │
# │    response.set_cookie(                                             │
# │        key="access_token",                                          │
# │        value=result['access_token'],                                │
# │        httponly=True,    ← JS can't read it (XSS protection)        │
# │        secure=False,     ← change to True in production (HTTPS)     │
# │        samesite="lax",                                              │
# │    )                                                                │
# │                                                                     │
# │  Browsers automatically attach cookies to every request.            │
# │  So the Next.js frontend never needs to manually set the            │
# │  Authorization header — the cookie is sent automatically.           │
# │                                                                     │
# │  This is also the ONLY way SSE (EventSource) can authenticate,      │
# │  because EventSource doesn't support custom headers.                │
# │                                                                     │
# │  WHO SENDS TOKENS IN COOKIES?                                       │
# │    → Browser / Next.js frontend (our primary client)                │
# │    → SSE streaming endpoints (EventSource API)                      │
# │                                                                     │
# └─────────────────────────────────────────────────────────────────────┘


async def get_current_user(
    request: Request,
    token_from_header: str | None = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """
    This dependency does 5 things in order:

    STEP 1 → Find the token (header first, then cookie fallback)
    STEP 2 → Decode & verify the JWT (signature + expiry)
    STEP 3 → Extract the user_id claim from the token payload
    STEP 4 → Fetch the actual User row from the database
    STEP 5 → Check if the account is still active (not banned/suspended)

    If ANY step fails → raise UnauthorizedException (401)
    If ALL steps pass → return the User object to the route
    """

    # ── STEP 1: Find the token ─────────────────────────────────────────
    # Priority: Header > Cookie
    # token_from_header → extracted by OAuth2PasswordBearer from
    #                      "Authorization: Bearer <token>" header
    # request.cookies   → the httpOnly cookie set by the login route
    token = token_from_header or request.cookies.get("access_token")

    if token is None:
        # No token anywhere → user is not logged in at all
        raise UnauthorizedException(message="Not authenticated")

    # ── STEP 2: Decode the JWT ─────────────────────────────────────────
    # jwt.decode() does TWO checks automatically:
    #   1. SIGNATURE — was this token signed with OUR secret key?
    #      (prevents forgery — nobody can create a fake token)
    #   2. EXPIRATION — is the "exp" claim still in the future?
    #      (prevents using old/expired tokens)
    try:
        payload: dict = jwt.decode(
            token,
            ACCESS_TOKEN_SECRET,
            algorithms=[ALOGRITHEM],
        )
    except jwt.ExpiredSignatureError:
        # Token was valid but has expired → user needs to refresh or re-login
        raise UnauthorizedException(message="Access token has expired")
    except jwt.InvalidTokenError:
        # Token is malformed, wrong signature, or tampered with
        raise UnauthorizedException(message="Could not validate credentials")

    # ── STEP 3: Extract the user_id from the payload ───────────────────
    # Our login creates tokens with: {'user_id': user.id, 'email': ..., 'full_name': ...}
    # We only need user_id to look up the user in the DB
    user_id: str | None = payload.get("user_id")
    if user_id is None:
        # Token is valid JWT but doesn't contain user_id → not our token
        raise UnauthorizedException(message="Could not validate credentials")

    # ── STEP 4: Fetch the user from the database ──────────────────────
    # Why not just trust the token payload?
    # Because the user might have been DELETED from the DB after the
    # token was issued. The token is still valid, but the user is gone.
    user = (await session.exec(select(User).where(User.id == user_id))).first()
    if user is None:
        raise UnauthorizedException(message="Could not validate credentials")

    # ── STEP 5: Check if the account is still active ──────────────────
    # is_active is an admin-level kill switch.
    # Even if the token is valid and the user exists, an admin may have
    # banned/suspended the account. This check catches that.
    if not user.is_active:
        raise UnauthorizedException(message="Account has been deactivated")

    # ── ALL CHECKS PASSED — return the user to the route ──────────────
    # The route receives this as: current_user: User = Depends(get_current_user)
    return user


# ┌─────────────────────────────────────────────────────────────────────┐
# │                        HOW TO USE THIS                              │
# ├─────────────────────────────────────────────────────────────────────┤
# │                                                                     │
# │  PROTECTED route (needs login):                                     │
# │                                                                     │
# │    from src.core.dependencies import get_current_user               │
# │                                                                     │
# │    @router.post("/job")                                             │
# │    async def create_job(                                            │
# │        current_user: User = Depends(get_current_user),              │
# │        session: AsyncSession = Depends(get_async_session),          │
# │    ):                                                               │
# │        # current_user is the authenticated User from the DB         │
# │        # If token is invalid, this line never runs — 401 returned   │
# │        ...                                                          │
# │                                                                     │
# │  PUBLIC route (no login needed):                                    │
# │    → Just don't add Depends(get_current_user)                       │
# │    → register, login, verify-email, resend-verification, refresh    │
# │                                                                     │
# └─────────────────────────────────────────────────────────────────────┘
