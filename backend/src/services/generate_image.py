import asyncio
import os
import logging

from sqlmodel import select 
from ..db.db import async_session_maker
from .imagekit_services import upload_file 
from .openai_service import generate_thumbnail
from ..models import Thumbnails , Job , ThumbnailStatus , JobStatus
from ..constants import STYLES , MAIN_PROMPT 

from ..core.exceptions import ApplicationException , NotFoundException
import time
logger = logging.getLogger(__name__)



#* main function which marks job as completed if all thumbnail are done either generated or either failed
async def update_job_status_if_done(job_id: str):
  try:  
    """
    Checks all thumbnails for a job.
    If none are pending or generating, marks the job as COMPLETED (or FAILED if all failed).
    """
    async with async_session_maker() as session:
        thumbnails = (await session.exec(
            select(Thumbnails).where(Thumbnails.job_id == job_id)
        )).all()

        # Check if any thumbnail is still pending or generating
        still_running = any(
            t.status in (ThumbnailStatus.PENDING.value, ThumbnailStatus.GENERATING.value)
            for t in thumbnails
        )
        if still_running:
            return  # Other thumbnails are still in flight, do not finalize job yet

        # All thumbnails have reached terminal state (generated or failed)
        job = await session.get(Job, job_id)
        if not job:
            raise NotFoundException(message="JOB NOT FOUND")
        if job:
            all_failed = all(t.status == ThumbnailStatus.FAILED.value for t in thumbnails)
            job.status = JobStatus.FAILED.value if all_failed else JobStatus.COMPLETED.value
            job.error_message = "All thumbnails failed" if all_failed else None
            await session.commit()
            logger.info(f"Job {job_id} finalized with status: {job.status}")
            
  except Exception as error:
     return {"error" , error}
     


#* generate each single thumbnail 
async def generate_single_thumbnail(thumbnail_id: str, user_prompt: str, headshot_url: str ,) -> dict:
   start = time.monotonic()                                                                                                               
   logger.info(f"Generating thumbnail of ID : {thumbnail_id}")

   
   async with async_session_maker() as session:
     thumbnail = await session.get(Thumbnails , thumbnail_id)
     thumbnail.status = ThumbnailStatus.GENERATING.value
     style = thumbnail.style_name
    #session.add(thumbnail) #* this is unecessery bcz we are updating and existing row in db
     await session.commit()

   style_prompt = STYLES.get(style, "")

   try:  
      
     image_bytes = await generate_thumbnail(user_prompt, MAIN_PROMPT, style_prompt, headshot_url)
     async with async_session_maker() as session:
        thumbnail = await session.get(Thumbnails , thumbnail_id)
        job_id = thumbnail.job_id

     #? asyncio.to_thread was specifically created in Python 3.9+ for this exact problem: when you have a synchronous third-party library (like ImageKit SDK) that you
     #? need to call from async code.
                                                                                                                                                                     
     url = await asyncio.to_thread(upload_file , image_bytes , f"thumbnail_{thumbnail_id}.webp", folder=f"thumbnails/{job_id}")
     async with async_session_maker() as session:
         thumbnail = await session.get(Thumbnails , thumbnail_id)
         thumbnail.status = ThumbnailStatus.GENERATED.value
         thumbnail.imageKit_url = url.url
         thumbnail.imageKit_file_id = url.file_id
         await session.commit()

     logger.info(f"Thumbnail generated and uploaded successfully for thumbnail_id: {thumbnail_id}")
     elapsed = time.monotonic() - start
     logger.info(f"Thumbnail {thumbnail_id} generation took {elapsed:.2f}s")

     await update_job_status_if_done(job_id)
     return {"thumbnail_id": thumbnail_id, "imageKit_url": url.url}

   except ApplicationException as e:
      logger.error(f"Error  while generating thumbnail updating DB..!")
      async with async_session_maker() as session:
         thumbnail = await session.get(Thumbnails , thumbnail_id)
         thumbnail.status =ThumbnailStatus.FAILED.value
         thumbnail.error_message = e.message 
         await session.commit()

         await update_job_status_if_done(job_id)
         return {"error": e.message} 
      
   except Exception as e:
      logger.error(f"Error  while generating thumbnail updating DB..!")
      async with async_session_maker() as session:
            thumbnail = await session.get(Thumbnails , thumbnail_id)
            thumbnail.status = ThumbnailStatus.FAILED.value
            thumbnail.error_message = "Internal Server Error" 
            await session.commit()

            await update_job_status_if_done(job_id)
            return {"error": str(e)} 
      
   



#* create tasks of generate_single_thumbnail based on the no of thumbnail user wants to generate
async def process_job(job_id : str):
   logger.info(f"Processing job with ID: {job_id}")

   async with async_session_maker() as session:
      job = await session.get(Job , job_id)
      if not job:
         logger.error(f"Job with ID {job_id} not found.")
         raise ValueError(f"Job with ID {job_id} not found.")
      else:
         job.status = "processing"
         prompt = job.user_prompt
         headshot_url = job.headshot_url
         await session.commit()

      thumbnails = (await session.exec(select(Thumbnails).where(Thumbnails.job_id == job_id))).all()

   thumbnails_id = [t.id for t in thumbnails]
   task = [
            generate_single_thumbnail(thumbnail_id=id, user_prompt=prompt, headshot_url=headshot_url)
            for id in thumbnails_id
         ]

   result = await asyncio.gather(*task , return_exceptions=True)
   logger.info(f"all task created by the process_job with JOB-ID {job_id} has been completed with result : {result}")

   await update_job_status_if_done(job.id)








#? why we pass our upload_file function in asyncio.to_thread  ?

#* asyncio.to_thread was specifically created in Python 3.9+ for this exact problem: when you have a synchronous third-party library (like ImageKit SDK) that you
#* need to call from async code.

#? benefit ?


# ask A hits 'await' (waiting for ImageKit upload)                                                                                                               
#       └─▶ "I'm waiting! Event loop, go do other work!"                                                                                                              
#             └─▶ Event loop runs Task B (SSE loop sends a : ping)                                                                                                    
#             └─▶ Event loop runs Task C (another thumbnail starts)
#     ImageKit upload finishes!
#       └─▶ Event loop resumes Task A right where it paused
#       └─▶ Task A saves the URL to the database!
  
#   Nothing freezes, and everything cooperative shares the thread while waiting for network responses.
#   ──────
#   ### 2. With sync (blocking):
  
#     Task A calls upload_file()
#       └─▶ The entire Python process freezes like a stone.
#       └─▶ SSE ping cannot run.
#       └─▶ Other thumbnails cannot progress.
#       └─▶ The server is stuck until ImageKit responds.
  
#   You have the exact right mental model now. Using await asyncio.to_thread(upload_file, ...) gives you the best of both worlds: your code executes in perfect order 
#   step-by-step, while the rest of your server stays fast and responsive.
