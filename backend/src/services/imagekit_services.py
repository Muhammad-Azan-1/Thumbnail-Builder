from imagekitio import ImageKit
from ..core.config import IMAGEKIT_PRIVATE_KEY 
from ..core.exceptions import ApplicationException
import logging

imagekit = ImageKit(
    private_key=IMAGEKIT_PRIVATE_KEY
    
)

logger = logging.getLogger(__name__)

def upload_file(file_bytes : bytes , file_name : str , folder : str):
    logger.info(f"Uploading file {file_name} to ImageKit in folder {folder}")
    """
    Uploads a file to ImageKit.

    Args:
        file_bytes (bytes): The bytes of the file to upload.
        file_name (str): The name of the file.
        folder (str): The folder in which to upload the file.

    Returns:
        dict: A dictionary containing the response from ImageKit.
    """
    try:
        response = imagekit.files.upload(
            file=file_bytes,
            file_name=file_name,
            use_unique_file_name=True,
            is_private_file=False,
            folder=folder,
        )
        return response
    except Exception as e:
        # 1. Developer view: Log the raw ugly error
        logger.error(f"Error uploading file to ImageKit: {repr(e)}")
        
        # 2. Determine user-friendly message
        error_str = str(e).lower()
        if "401" in error_str or "unauthorized" in error_str:
            msg = "Image upload service is temporarily unavailable."
        elif "timeout" in error_str or "network" in error_str:
            msg = "Network error while saving the image. Please try again."
        elif "413" in error_str or "large" in error_str or "429" in error_str:
            msg = "The image file is too large to upload."
        else:
            msg = "An unexpected error occurred while saving the image."
            
        # 3. Raise the clean exception
        raise ApplicationException(name="IMAGEKIT_SERVICE_ERROR", message=msg, statusCode=500)
    

def delete_file(file_id : str):
    try:
        return imagekit.files.delete(file_id)
    except Exception as error:
        logger.error("Failed to delete ImageKit file %s: %s", file_id, error)
        raise ApplicationException(
            name="IMAGEKIT_SERVICE_ERROR",
            message="Failed to delete image.",
            statusCode=500,
        )


def get_variants(base_url:str)-> dict[str, str]:
    "return 3 size variants URLS using imagekit transformation"
    return {
        
        "youtube" : imagekit.helper.build_url(src=base_url , transformation=[{"height": 720 , "width": 1280 , "crop": "maintain_ratio", "focus" : "auto" }]),
        "shorts" : imagekit.helper.build_url(src=base_url , transformation=[{"height": 1920 , "width": 1080 ,  "crop": "maintain_ratio", "focus" : "auto" }]),
        "square" : imagekit.helper.build_url(src=base_url , transformation=[{"height": 1080 , "width": 1080 ,  "crop": "maintain_ratio", "focus" : "auto" }])
    }

