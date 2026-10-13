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



    jobs: List[Job] = Relationship(back_populates="user")