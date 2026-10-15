
from sqlmodel import select  
from sqlmodel.ext.asyncio.session import AsyncSession                                               
from fastapi import HTTPException, status                                            
from ..models.models import User                                                     
from ..schemas.users import UserRegistrationRequest, UserLoginRequest                                  
from ..core.security import (                                                        
    hash_password, verify_password,                                                  
    create_access_token, create_refresh_token,                                       
    generate_verification_otp, generate_random_token                                 
)                                                                                    
from datetime import datetime, timedelta, timezone


class AuthService():
    pass