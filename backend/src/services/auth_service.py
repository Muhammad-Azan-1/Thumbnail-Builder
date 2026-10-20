from sqlmodel import select  
from sqlmodel.ext.asyncio.session import AsyncSession                                                                                         
from ..models.models import User                
from ..schemas.users import UserRegistrationRequest, UserLoginRequest                                  
from ..core.security import (                                                        
    generate_verfication_otp, hash_password, verify_password,                                                  
    create_access_token, create_refresh_token,                                       
    generate_verfication_otp, generate_verification_token      
)                                                                                    
from datetime import datetime, timedelta, timezone
from ..core.exceptions import ApplicationException
from .email_verfication_service import EmailVerificationService
import hashlib

class AuthService():

    @staticmethod
    async def register_user(user_data : UserRegistrationRequest , session : AsyncSession) -> User:
        """Register a new user in the database.
        Args:
            user_data (UserRegistrationRequest): The user registration data.
            session (AsyncSession): The database session for executing queries.
        Returns:
            User: The newly created user object.
        """
        #checking if user already exists
        existing_user =  await session.exec(select(User).where(user_data.email == User.email)).first()

        if (existing_user):
            raise ApplicationException(
                name="USER_ALREADY_EXISTS",
                message="A user with this email already exists.",
                statusCode=400,
              
            )

        # create OTP and and verification token for email verification
        raw_otp , hashed_otp = generate_verfication_otp()
        raw_token, hashed_token  = generate_verification_token()

        # create a new User instance with the provided data and hashed password
        user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hash_password(user_data.password),
        verification_otp=hashed_otp,
        verification_token=hashed_token,
        verification_expiry=datetime.now(timezone.utc) + timedelta(minutes=1)  # OTP and token expiry set to 1 minutes from now
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Send email verfication email with magic link and OTP to the user
        await EmailVerificationService.send_email_verfication(
            otp=raw_otp,
            verification_token=raw_token,
            recipient_email=user_data.email,
            recipient_name=user_data.full_name
        )

        return user


    @staticmethod
    async def verify_email_verification(otp: str, token: str, session: AsyncSession) -> User:
        """Verify the user's email using the provided OTP and verification token.
        Args:
            otp (str): The OTP provided by the user.
            token (str): The verification token provided by the user.
            session (AsyncSession): The database session for executing queries.
        Returns:
            User: Sucessfully verfied message
        Raises:
            ApplicationException: If the OTP or token is invalid or expired. or if email is already verfied
        """

        expires_after = datetime.now(timezone.utc)
        if otp:
            hashed_otp = hashlib.sha256(otp.encode()).hexdigest()
            query = select(User).where(
                User.verification_otp == hashed_otp,
                User.verification_expiry > expires_after,
            )
        else:
            hashed_token = hashlib.sha256(token.encode()).hexdigest()
            query = select(User).where(
                User.verification_token == hashed_token,
                User.verification_expiry > expires_after,
            )

        user = (await session.exec(query)).first()
        

        if not user:
            raise ApplicationException(
                name="INVALID_VERIFICATION_TOKEN",
                message="Invalid or expired verification token.",
                statusCode=400,
              
            )

        if(user.is_verified):
            raise ApplicationException(
                name="EMAIL_ALREADY_VERIFIED",
                message="Email is already verified.",
                statusCode=400,
            )

        user.is_verified = True
        user.verification_otp = None
        user.verification_token = None
        user.verification_expiry = None

        await session.commit()
        return "Email verfied successfully"
        

    @staticmethod
    async def login_user(user_data : UserLoginRequest , session : AsyncSession) -> dict:
        """Authenticate a user and generate access and refresh tokens.
        Args:
            user_data (UserLoginRequest): The user login data.
            session (AsyncSession): The database session for executing queries.
        Returns:
            dict: A dictionary containing the access and refresh tokens.    
        """
        # fetch user first

        user = (await session.exec(select(User).where(User.email == user_data.email))).first()
    

        if not user:
            raise ApplicationException(
                name="INVALED_EMAIL_OR_PASSWORD",
                message="Invaled Email or Password",
                statusCode=400,
            )


        if not verify_password(user_data.password , user.password):
            raise ApplicationException(
                name="INVALED_EMAIL_OR_PASSWORD",
                message="Invaled Email or Password",
                statusCode=400,
            )


        if not user.is_verified:
           raise ApplicationException(
                name="EMAIL_NOT_VERIFIED",
                message="Email you entered is not verified",
                statusCode=400,
            )

       #* after succesfully identifying user now we will generate access and refresh token for him
        access_token = create_access_token({'user_id' : user.id , "email" : user.email , "full_name" : user.full_name})
        refresh_token = create_refresh_token({'user_id' : user.id})    

        user.refresh_token = refresh_token # we can also hash it before saving to DB  
        await session.commit()

        return {"access_token": access_token,                                                                         
               "refresh_token": refresh_token,                                                                       
               "user": user,         
             }


    @staticmethod
    async def resend_email_verification(email : str , session : AsyncSession):

      user = (await session.exec(select(User).where(User.email == email))).first()

      if not user or user.is_verified:
            return "If an unverified account exists for that email, a verification link has been sent."

      raw_otp, hashed_otp = generate_verfication_otp()
      raw_token, hashed_token = generate_verification_token()

      user.verification_otp = hashed_otp
      user.verification_token = hashed_token
      user.verification_expiry = datetime.now(timezone.utc) + timedelta(minutes=1)

      await EmailVerificationService.send_email_verfication(
          otp=raw_otp,
          verification_token=raw_token,
          recipient_email=user.email,
          recipient_name=user.full_name,
      )
      await session.commit()

      return "If an unverified account exists for that email, a verification link has been sent."