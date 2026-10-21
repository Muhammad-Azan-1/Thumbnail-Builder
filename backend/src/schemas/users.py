from pydantic import BaseModel , EmailStr , model_validator
from datetime import datetime   


class UserRegistrationRequest(BaseModel):
    email : EmailStr
    full_name : str
    password : str

class UserLoginRequest(BaseModel):
    email : str
    password : str


class ResendEmailVerificationRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):                                                         
        id: str                                                                          
        full_name: str                                                                   
        email: EmailStr                                                                  
        avatar_url: str | None = None                                                    
        is_verified: bool                                                                
        created_at: datetime   

class LoginUserResponse(UserPublic):
     access_token : str

class ResetPasswordRequest(BaseModel):
     token : str
     new_password : str



class EmailVerificationRequest(BaseModel):
    verification_token: str | None = None
    otp: str | None = None

    @model_validator(mode="after")
    def require_exactly_one_method(self):
        if (self.verification_token is None) == (self.otp is None):
            raise ValueError("Provide either verification_token or otp, but not both.")
        return self



#* what this do  ( **UserPublic.model_validate(result["user"]).model_dump())                                                                                                         
#     result["user"]  # ← User model from DB with ALL fields                                                        
                                                                                                                  
#     { id, full_name, email, password, auth_provider, google_id, avatar_url,                                       
#       verification_token, verification_otp, verification_expiry,                                                  
#       reset_password_token, reset_password_expiry, refresh_token,                                                 
#       is_verified, is_active, created_at, updated_at, jobs }                                                      
                                                                                                                  
#   ↓

#     UserPublic.model_validate(result["user"])  # ← picks ONLY keys that match UserPublic fields
  
#     UserPublic(id="...", full_name="...", email="...", avatar_url=None, is_verified=True, created_at="...")       
  
#   All sensitive fields (password, tokens, OTPs) are ignored because they're not defined in UserPublic.            
  
#   ↓

#     .model_dump()  # ← converts that Pydantic object into a plain dict
  
#     {"id": "...", "full_name": "...", "email": "...", "avatar_url": None, "is_verified": True, "created_at": "... 
#   "}

#   Then when you spread it with **:
  
#     LoginUserResponse(
#         **{"id": "...", "full_name": "...", "email": "...", ...},  # ← unpacked as keyword args
#         access_token=result["access_token"],                       # ← added on top
#     )
  
#   It's the same as writing:
  
#     LoginUserResponse(
#         id="...",
#         full_name="...",
#         email="...",
#         avatar_url=None,
#         is_verified=True,
#         created_at="...",
#         access_token="eyJhbG...",
#     )