from fastapi import APIRouter, Depends, HTTPException , Response
from src.models.models import User
import logging


from src.services.auth_service import AuthService
from ..core.response import ApiResponse
from ..core.exceptions import (ApplicationException, NotFoundException , UnauthorizedException)
from ..schemas.users import UserRegistrationRequest,  LoginUserResponse, UserLoginRequest ,UserPublic,EmailVerificationRequest, ResendEmailVerificationRequest

from sqlmodel.ext.asyncio.session import AsyncSession
from ..db.db import get_async_session




router = APIRouter( prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

@router.post("/register" , response_model=ApiResponse[UserPublic])
async def register_user(user_data : UserRegistrationRequest , session : AsyncSession = Depends(get_async_session)):
    """
    Register a new user.
    """
    user = await AuthService.register_user(user_data, session)
    return ApiResponse(
            success=True,
            message="User registered successfully. Please check your email for verification.",
            data=UserPublic.model_validate(user).model_dump() # this will filter all unnecessary fields and return only the public fields of the user model
        )


@router.post("/verify-email" , response_model=ApiResponse)
async def verify_email(verification_data: EmailVerificationRequest, session: AsyncSession = Depends(get_async_session)):
    """
    Verify a user's email using the provided verification token and OTP.
    """
    response = await AuthService.verify_email_verification(verification_data.otp , verification_data.verification_token, session)
    return ApiResponse(
            success=True,
            message=response,
            data={}
        )


@router.post("/login" , response_model=ApiResponse[LoginUserResponse])
async def login(user_data : UserLoginRequest ,  response: Response , session : AsyncSession = Depends(get_async_session)):

    result = await AuthService.login_user(user_data , session)

    response.set_cookie(
        key="access_token", # cookie name            
        value=result['access_token'],  # the JWT string       
        httponly=True, # JS can't read it (document.cookie won't show it)   
        secure=False,  # False = works on HTTP (localhost). True = HTTPS only   
        samesite="lax",
        max_age=60*60*24 #  # cookie lives for 86400 seconds = 1 day     
    )

    response.set_cookie(                                                                                      
            key="refresh_token",                                                                                  
            value=result["refresh_token"],                                                                        
            httponly=True, secure=False, samesite="lax",                                                          
            max_age=60 * 60 * 24 * 7,                                                                             
        )          

    return ApiResponse(                                                                                       
            success=True,                                                                                         
            message="Login successful",                                                                           
            data=LoginUserResponse(
            **UserPublic.model_validate(result["user"]).model_dump() , 
            access_token=result['access_token'])                                        
        )      


@router.post('/resend-email-verification' ,  response_model=ApiResponse)
async def resend_email_verification(request: ResendEmailVerificationRequest, session: AsyncSession = Depends(get_async_session)):

    result = await AuthService.resend_email_verification(request.email, session)

    return ApiResponse(
        success=True,                 
        message=result,
        data={},
    )