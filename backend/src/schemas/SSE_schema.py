from pydantic import BaseModel
from enum import Enum 

class SSE_Events(str, Enum):
    THUMBNAIL_READY = "thumbnail_ready"
    THUMBNAIL_FAILED = "thumbnail_failed"
    JOB_COMPLETE = "job_completed"
    FAILED = "failed"