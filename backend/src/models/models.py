from sqlmodel import Field , SQLModel , Relationship
from typing import Optional , List 
from ..db.db import _uuid , _now
from datetime import datetime
from enum import Enum


class ThumbnailStatus(str , Enum):
    PENDING = "pending"
    GENERATING = "generating"
    GENERATED = "generated"
    FAILED = "failed"

class JobStatus(str , Enum):
        PENDING = "pending"
        PROCESSING = "processing"
        COMPLETED = "completed"
        FAILED = "failed"

class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"
    
# store the thumbnail information in the database

class Thumbnails(SQLModel , table=True):
    __tablename__ = "thumbnails"
    id: str = Field(default_factory=_uuid , primary_key=True , index=True)
    job_id: str = Field(foreign_key="job.id" , nullable=False)
    style_name : Optional[str]  = Field(default="",description="Style preset or style modifier prompt" )
    error_message : Optional[str] = Field(default=None)
    status: ThumbnailStatus = Field(
        default=ThumbnailStatus.PENDING,
        nullable=False
    )
    imageKit_url : str = Field(default=None , nullable=False)
    imageKit_file_id : str = Field(default=None , nullable=True)
    created_at: datetime = Field(default_factory=_now , nullable=False)
    
    job : Optional["Job"] = Relationship(back_populates="thumbnails")

# can I also inscept event looop ike firt ir reuns route then once route complte return the route remove from the event loop and the task we created comes 
# store the job information in the database for each thumbnail generation request. Each job can have multiple thumbnails associated with it.
class Job(SQLModel , table=True):
    __tablename__ = "job"
    id: str = Field(default_factory=_uuid , primary_key=True , index=True)
    user_id: str = Field(foreign_key="user.id" , nullable=False)    
    user_prompt : str = Field(default="" , nullable=False)
    status: JobStatus = Field(
        default=JobStatus.PENDING,
        nullable=False  
    )
    error_message : Optional[str] = Field(default=None)
    num_of_thumbnails : int = Field(default=1 , le=3 , ge=1 , nullable=False)
    created_at: datetime = Field(default_factory=_now , nullable=False)
    headshot_url : str = Field(default=None , nullable=False)

    thumbnails : List[Thumbnails] = Relationship(back_populates="job")
    user: Optional["User"] = Relationship(back_populates="jobs")


class User(SQLModel , table=True):
    __tablename__ = "user"
    id: str = Field(default_factory=_uuid , primary_key=True , index=True)
    full_name: str = Field(default=None , nullable=False)
    email: str = Field(default=None , nullable=False , unique=True , index=True)
    password: Optional[str] = Field(default=None , nullable=True)
    auth_provider: AuthProvider = Field(default=AuthProvider.LOCAL , nullable=False)
    google_id: str = Field(default=None , nullable=True)
    avatar_url: str = Field(default=None , nullable=True)

    verification_token: str = Field(default=None , nullable=True) # for magic link verification
    verification_otp : str = Field(default=None , nullable=True) # for otp verification

    verification_expiry : datetime = Field(default=None , nullable=True) # the expiry time for the verification token or otp

    reset_password_token: str = Field(default=None , nullable=True) # for password reset
    reset_password_expiry : datetime = Field(default=None , nullable=True) # for password reset
    
    refresh_token: str = Field(default=None , nullable=True) 
    
    is_verified : bool = Field(default=False , nullable=False)
    is_active : bool = Field(default=False , nullable=False) 
    last_login_provider : Optional[AuthProvider] = Field(default=None , nullable=True)
  

    created_at: datetime = Field(default_factory=_now , nullable=False)
    updated_at: datetime = Field(default_factory=_now , nullable=False)

    jobs: List[Job] = Relationship(back_populates="user")