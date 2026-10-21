import hashlib
import secrets 
from datetime import datetime , timedelta , timezone
import jwt
from pwdlib import PasswordHash
from .config import (REFRESH_TOKEN_EXPIRY , REFRESH_TOKEN_SECRET , ACCESS_TOKEN_EXPIRY , ACCESS_TOKEN_SECRET , ALOGRITHEM)


# Creates a configured hasher object; use .hash() to hash passwords and .verify() to check them.
password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return password_hasher.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user"""
    return password_hasher.verify(password, hashed_password)

def create_access_token(data: dict) -> str:
    """Create a JWT access token with an expiration time
    data: A dictionary containing the payload data for the token. This can include user information or any other relevant data.
    jwt.encode() : takes three arguments: the payload (data to be encoded),
    the secret key used for signing the token, and the algorithm used for signing.
    It returns a JWT token as a string.
    ."""
    expiry = datetime.now(timezone.utc) + timedelta(days=int(ACCESS_TOKEN_EXPIRY[:-1])) # access token expiry is set to 1 day from the current time (when ever this function calls)
    payload = {**data, "exp": expiry}
    return jwt.encode(payload, ACCESS_TOKEN_SECRET, algorithm=ALOGRITHEM)
  

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token with an expiration time
    data: A dictionary containing the payload data for the token. This can include user information or any other relevant data.
    jwt.encode() : takes three arguments: the payload (data to be encoded),
    the secret key used for signing the token, and the algorithm used for signing.
    It returns a JWT token as a string.
    ."""

    expiry = datetime.now(timezone.utc) + timedelta(days=int(REFRESH_TOKEN_EXPIRY[:-1]))
    payload = {**data, "exp": expiry}
    return jwt.encode(payload, REFRESH_TOKEN_SECRET, algorithm=ALOGRITHEM)


def generate_verfication_otp() -> tuple[str , str]:
    """Generate a random 6-digit OTP and its hashed version for verification purposes.
    Returns:
        tuple: A tuple containing the plain OTP and its hashed version.
    """
    raw_otp = str(secrets.randbelow(900000) + 100000)  # generate a 6 digit OTP 
    hashed_otp = hashlib.sha256(raw_otp.encode()).hexdigest()  # Hash the OTP using SHA-256
    return raw_otp, hashed_otp

def generate_verification_token() -> str:
    """Generate a random verification token for email verification with magic link .
    Returns:
        str: A random verification token.
    """
    raw_token = secrets.token_hex(32)  # Generate a random 32-byte token and convert it to a hexadecimal string                                           
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()   # Hash the token using SHA-256               
    return raw_token, hashed_token   

def generate_reset_password_token()->str:
    """Generate a random  reset password token for reset password  verfication with magic link .
    Returns:
        str: A random verification token.
    """
    raw_token = secrets.token_hex(32)
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()  
    return raw_token, hashed_token   




#! important note:

#?   │ Why return both raw and hashed?                                                      
#*   │ Exactly like in your Express code: you store the hashed version in your database (so 
#*   │ if your database leaks, attackers cannot use the OTPs or tokens), and you send the   
#*   |raw version to the user via Email/SMS. 


#? About JWT verification:
#* When the server decodes and verifies a JWT, it typically checks:
# Signature: Was the token signed with the expected secret and allowed algorithm, and has it remained unchanged?
# Expiration (exp): Is the token still within its validity period?
# If either check fails, the server rejects the token. With PyJWT, use jwt.decode(...) with the expected algorithm; expiration verification is enabled by default. jwt.decode(...) returns the payload claims if verification succeeds.