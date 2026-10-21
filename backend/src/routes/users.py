from fastapi import APIRouter, Depends , Response , Cookie , Request 
from src.models.models import User
import logging
import jwt
from sqlmodel import select , delete

from src.services.auth_service import AuthService
from ..core.response import ApiResponse
from ..core.exceptions import (ApplicationException, NotFoundException , UnauthorizedException)
from ..schemas.users import UserRegistrationRequest,  LoginUserResponse, UserLoginRequest , ResetPasswordRequest ,UserPublic,EmailVerificationRequest, ResendEmailVerificationRequest

from sqlmodel.ext.asyncio.session import AsyncSession
from ..db.db import get_async_session
from ..core.config import ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ALOGRITHEM




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


# async def refresh_access_token(request: Request):
#     refresh_token = request.cookies.get("refresh_token")

#* or
@router.post("/refresh-access-token" , response_model=ApiResponse[dict])
async def refresh_access_token( response : Response , refresh_token : str | None = Cookie(default=None) , session : AsyncSession = Depends(get_async_session)): #* this parameter tells fast_api to look cooki named refresh_token in the incoming request

    if not refresh_token:
        raise ApplicationException(
            name="MISSING_REFRESH_TOKEN",
            message="Refresh token is missing.",
            statusCode=401,
        )

    try:
        payload = jwt.decode(
        refresh_token,
        REFRESH_TOKEN_SECRET,
        algorithms=[ALOGRITHEM],

        )
    except jwt.ExpiredSignatureError:
        # Token was valid but has expired → user needs to refresh or re-login
            raise UnauthorizedException(message="Refresh token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        # Token is malformed, wrong signature, or tampered with
            raise UnauthorizedException(message="Refresh token has expired. Please log in again.")
    
    user_id = payload.get("user_id")
    if user_id is None:
            raise UnauthorizedException(message="Could not validate credentials")

    user = (await session.exec(select(User).where(User.id == user_id))).first()
  
    if not user or user.refresh_token != refresh_token:
           raise UnauthorizedException(message="refresh token has been used or expired")
         
            
    result = await AuthService.refresh_acess_token(user , session)

    response.set_cookie(
        key="access_token",
        value=result['access_token'], 
        httponly=True,
        secure=False, 
        samesite="lax",
        max_age=60*60*24
    )

    response.set_cookie(                                                                                      
        key="refresh_token",                                                                                  
        value=result["refresh_token"],                                                                        
        httponly=True, secure=False, samesite="lax",                                                          
        max_age=60 * 60 * 24 * 7,                                                                             
        )       

    return ApiResponse(                                                                                       
        success=True,                                                                                         
        message="access token has been generated",                                                                           
        data={'access_token' : result['access_token']}
                      
        )         




    
@router.post('/forgot-password-verfication' , response_model=ApiResponse)
async def forgot_password_verfication(request: ResendEmailVerificationRequest , session : AsyncSession = Depends(get_async_session)):
 
    result = await AuthService.forgot_password_verfication(request.email, session)
    
    return ApiResponse(
    success=True,                 
     message=result,
         )

@router.post("/reset-password" , response_model=ApiResponse)
async def reset_password(request : ResetPasswordRequest, session : AsyncSession = Depends(get_async_session)):
     result  = await AuthService.reset_password(request.token , request.new_password , session)
     return ApiResponse(
        message=result
     )
          

@router.post("/google-auth")
async def google_auth():
     pass



@router.post("/logout", response_model=ApiResponse)
async def logout(
    response: Response,
    request: Request,
    session: AsyncSession = Depends(get_async_session),
):
    current_user = None
    access_token =  request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    if access_token:
        try:
            access_payload = jwt.decode(
                access_token,
                ACCESS_TOKEN_SECRET,
                algorithms=[ALOGRITHEM],
            )
        except jwt.InvalidTokenError:
            pass
        else:
            user_id = access_payload.get("user_id")
            if user_id is not None:
                current_user = (
                    await session.exec(select(User).where(User.id == user_id))
                ).first()

    if current_user is None and refresh_token:
        try:
            refresh_payload = jwt.decode(
                refresh_token,
                REFRESH_TOKEN_SECRET,
                algorithms=[ALOGRITHEM],
            )
        except jwt.InvalidTokenError:
            pass
        else:
            user_id = refresh_payload.get("user_id")
            if user_id is not None:
                refresh_user = (
                    await session.exec(select(User).where(User.id == user_id))
                ).first()
                if refresh_user is not None and refresh_user.refresh_token == refresh_token:
                    current_user = refresh_user

    if current_user is not None:
        current_user.refresh_token = None
        await session.commit()

    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return ApiResponse(
        message="Logged out successfully.",
        data={},
    )
