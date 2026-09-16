from openai import AsyncOpenAI
import base64
from ..config import OPENAI_API_KEY
import logging
from ..core.exceptions import ApplicationException 

client = AsyncOpenAI(
    api_key=OPENAI_API_KEY
)

logger = logging.getLogger(__name__)


async def generate_thumbnail(user_prompt : str , main_prompt : str , style_prompt : str , headshot_url:str)->bytes:
    logger.info("Calling OpenAI API for generating thumbnail Image")
    try:
        full_prompt = (
        f"{main_prompt}\n\n"
        f"User_Prompt : {user_prompt}\n\n"
        f"Style_Prompt : { style_prompt if style_prompt else 'No specific style provided' }\n\n"
        "Important: The generated thumbnail Must prominently feature the object."
        "show in the provided reference headshot photo. keep their likeness accurate."
        )
    
        response = await client.responses.create(
        model="gpt-4.1",
        input=[
        {"role" : "user" ,
         "content" : [
            {"type" : "input_text" , "text" : full_prompt},
            {"type" : "input_image" , "image_url" : headshot_url}
        ]}
        ],
        tools=[{"type": "image_generation" , "quality" : "medium" , "size" : "1536x1024" , "output_format":"webp"}],
        tool_choice="required"
    )

        for item in response.output:
            if item.type == "image_generation_call" and item.result:
                return base64.b64decode(item.result)
            
        # Fallback if OpenAI still didn't generate an image                                                                                                     
        raise ApplicationException(                                                                                                                             
                name="OPENAI_IMAGE_GENERATION_FAILED",                                                                                                              
                message="OpenAI did not generate an image for this request. Please check your photo or prompt.",                                                    
                statusCode=400                                                                                                                                      
            )     
            
    except Exception as e:
        logger.error(f"Error Processing OpenAI Request: {e}")
        error_str = str(e).lower()
        if "403" in error_str or "401" in error_str:                                                                                                                                              
            clean_msg = "Our image service is temporarily unavailable. Please try again later."                                                                                                   
        elif "429" in error_str:                                                                                                                                                                  
            clean_msg = "We are currently experiencing high traffic. Please wait a moment."                                                                                                       
        elif "content_policy_violation" in error_str or "400" in error_str:                                                                                                                       
            clean_msg = "Your prompt was rejected by our safety filters."                                                                                                                         
        else:                                                                                                                                                                                     
            clean_msg = "An unexpected error occurred while generating the image."   
        

        raise ApplicationException(name="OPENAI_SERVICE_ERROR", message=clean_msg, statusCode=500)

