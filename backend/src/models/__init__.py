from .models import Thumbnails , Job , ThumbnailStatus , JobStatus

__all__ = ["Job", "Thumbnails" , "ThumbnailStatus" , "JobStatus"] 


# By writing __all__ = ["Job", "Thumbnails"], you are setting a clear boundary. You are telling Python and your IDE:
# "These two classes are the only things in this file that other files should care about."