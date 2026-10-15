from pydantic import BaseModel , EmailStr
from datetime import datetime   


class UserRegistrationRequest(BaseModel):
    email : EmailStr
    full_name : str
    password : str

class UserLoginRequest(BaseModel):
    email : str
    password : str


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