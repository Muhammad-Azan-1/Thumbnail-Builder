from pydantic import BaseModel
from typing import Optional


class UploadHeadshotResponse(BaseModel):
    headshot_url: str
    message: Optional[str] = "Headshot uploaded successfully."


class UploadThumbnailRequest(BaseModel):
   styles : list[str]
   user_prompt  : str
   headshot_url : str
   num_of_thumbnails : int 

class UploadThumbnailResponse(BaseModel):
    job_id: str

class ThumbnailResponse(BaseModel):
    id: str
    job_id: str
    style_name: Optional[str]
    status: str
    imageKit_url: str = None
    error_message: Optional[str] = None
    variants: Optional[dict] = None
    created_at: str

class JobResponse(BaseModel):
    id: str
    user_prompt: str
    status: str
    num_of_thumbnails: int
    headshot_url: str
    created_at: str
    error_message: Optional[str] = None
    thumbnails: list[ThumbnailResponse] = []


class RetryThumbnailResponse(BaseModel):
    thumbnail_id : str
    job_id : str
    status : str

class ThumbnailDeleteRequest(BaseModel):
    thumbnail_ids: list[str]

class ThumbnailDeleteResponse(BaseModel):
    thumbnail_id : str
    message : str


