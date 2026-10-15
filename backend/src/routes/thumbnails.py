from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from ..db.db import get_async_session
from ..models import Thumbnails, Job , JobStatus , ThumbnailStatus ,  JobStatus
from ..services.generate_image import process_job , generate_single_thumbnail
from ..services.imagekit_services import upload_file, get_variants , delete_file
from..services.delete_empty_job import delete_empty_jobs
from ..constants import STYLE_ORDER 
import logging
from sqlmodel import select , delete


from ..core.exceptions import ApplicationException, NotFoundException

from ..schemas.thumbnails_schema import (
    JobResponse, ThumbnailResponse, 
    UploadHeadshotResponse , UploadThumbnailRequest ,
    UploadThumbnailResponse , RetryThumbnailResponse , 
    ThumbnailDeleteResponse , ThumbnailDeleteRequest
      )

from ..schemas.SSE_schema import SSE_Events

import asyncio
import json



logger = logging.getLogger(__name__)

router = APIRouter(prefix="/thumbnails", tags=["Thumbnails"])

#1 User upload the Image from frontend we saved that in imagekit
@router.post("/upload-headshot" , response_model=UploadHeadshotResponse)
async def upload_headshot(file : UploadFile = File(...)):
    logger.info(f"Received request to upload headshot: {file.filename}")
    file_bytes = await file.read()
    upload_response = upload_file(file_bytes, file.filename, folder="headshots" )

    if not upload_response or not upload_response.url:
        raise ApplicationException(name="IMAGEKIT_SERVICE", message="Failed to upload headshot to ImageKit.", statusCode=500)
    logger.info(f"Headshot uploaded successfully: {upload_response.url}")

    return UploadHeadshotResponse(headshot_url=upload_response.url)


# 2 Then user write the prompt and select the style and the no of images to generates and click the generate button 
@router.post("/job" , response_model=UploadThumbnailResponse)
async def generate_thumbnail(
    request : UploadThumbnailRequest,
    session : AsyncSession = Depends(get_async_session)
):
    logger.info(f"Received request to generate thumbnails")
    if request.num_of_thumbnails > 3 or request.num_of_thumbnails < 1:
        raise ApplicationException(name="VALIDATION", message="Number of thumbnails must be between 1 and 3.", statusCode=400)

    job = Job(
        user_prompt=request.user_prompt,
        status=JobStatus.PENDING,
        num_of_thumbnails=request.num_of_thumbnails,
        headshot_url=request.headshot_url
    )
    session.add(job)

    for style in request.styles:
        if style not in  STYLE_ORDER:
            raise ApplicationException(name="VALIDATION", message=f"Invalid style: {style}.", statusCode=400)
        else:
            thumbnail = Thumbnails(
                job_id=job.id,
                style_name=style,
                status=ThumbnailStatus.PENDING.value,
                imageKit_url=request.headshot_url
            )
            session.add(thumbnail)

    await session.commit()  

    # await asyncio.create_task(process_job(job.id)) # THIS IS BLOCKING CODE  # this way we only return the response to the user when all the thumbnails are generated and uploaded successfully. which is not a good idea because it will take a long time to generate the thumbnails and the user will have to wait for the response.
    asyncio.create_task(process_job(job.id)) # schedule task on event loop  # this way we return the response to the user immediately and the thumbnails will be generated and uploaded in the background. which is a good idea because it will not block the user and the user can continue to use the app while the thumbnails are being generated.
    return UploadThumbnailResponse(job_id=job.id)


# 3 get all thumbnails for a job id
@router.get("/job/{job_id}" , response_model=JobResponse)
async def get_thumbnails(job_id: str, session: AsyncSession = Depends(get_async_session)):
    logger.info(f"Received request to get thumbnails for job_id: {job_id}")
    job = await session.get(Job, job_id)
    if not job:
        raise NotFoundException(message="Job not found.")

    thumbnails = await session.exec(select(Thumbnails).where(Thumbnails.job_id == job_id))

    thumbails_list = []

    for t in thumbnails:
        variants = get_variants(t.imageKit_url) if t.imageKit_url else None
        thumbails_list.append(
        ThumbnailResponse(
            id=t.id,
            job_id=t.job_id,
            style_name=t.style_name,
            status=t.status,
            imageKit_url=t.imageKit_url,
            error_message=t.error_message,
            variants=variants,
            created_at=t.created_at.isoformat())    
        )

    return JobResponse(
        id=job.id,
        user_prompt=job.user_prompt,
        status=job.status,
        num_of_thumbnails=job.num_of_thumbnails,
        headshot_url=job.headshot_url,
        created_at=job.created_at.isoformat(),
        error_message=job.error_message,
        thumbnails=thumbails_list
    )




# if any thumbnail got failed and user wants to re-generate it
@router.post('/retry/thumbnail/{thumbnail_id}' , response_model=RetryThumbnailResponse)
async def retry_thumbnail_generation(thumbnail_id : str  ,session :  AsyncSession = Depends(get_async_session)):
    thumbnail = await session.get(Thumbnails , thumbnail_id)
    if not thumbnail:
        raise  NotFoundException(message="Thumbnail not found")
    if thumbnail.status != ThumbnailStatus.FAILED:
        raise ApplicationException(
            name="VALIDATION",
            message="Only failed thumbnails can be retried.",
            statusCode=409,
        )
    job  = await session.get(Job , thumbnail.job_id)
    if not job:
        raise NotFoundException(message="Parent job not found.")

    thumbnail.status = ThumbnailStatus.PENDING
    thumbnail.error_message = None
    job.status = JobStatus.PENDING
    await session.commit()

    #* 2 task created in event loop of uvicorn but run when the function returns 
    asyncio.create_task(generate_single_thumbnail(
        thumbnail_id=thumbnail.id,
        user_prompt=job.user_prompt,
        headshot_url=job.headshot_url
    ))

    #1
    return RetryThumbnailResponse(thumbnail_id=thumbnail.id , job_id=job.id , status=ThumbnailStatus.PENDING )
    

    
# if multiple thumbnail fails and user wants to batch generate
@router.post('/retry/job/{job_id}' , response_model=list[RetryThumbnailResponse])
async def retry_thumbnail_generation(job_id : str  ,session :  AsyncSession = Depends(get_async_session)):
    job = await session.get(Job , job_id)
    if not job:
        raise NotFoundException(message="Job ID not found")
    
    failed_thumbnails = (await session.exec(select(Thumbnails).where(Thumbnails.job_id == job_id , Thumbnails.status == ThumbnailStatus.FAILED))).all()

    if not failed_thumbnails:
        raise ApplicationException(
            name="VALIDATION",
            message="This job has no failed thumbnails to retry.",
            statusCode=409,
        )
    response = []
    for thumbnail in failed_thumbnails:
        thumbnail.status = ThumbnailStatus.PENDING
        thumbnail.error_message = None
        response.append(RetryThumbnailResponse(thumbnail_id=thumbnail.id , job_id=thumbnail.job_id , status=thumbnail.status))

    await session.commit()

    for thumbnail in failed_thumbnails:
        asyncio.create_task(generate_single_thumbnail(
            user_prompt=job.user_prompt,
            headshot_url=job.headshot_url,
             thumbnail_id=thumbnail.id
        ))
    return response


@router.delete('/delete-batch' , response_model=list[ThumbnailDeleteResponse])
async def delete_batch_thumbnails(thumbnail_ids : ThumbnailDeleteRequest ,  session : AsyncSession = Depends(get_async_session)):
    requested_ids = list(dict.fromkeys(thumbnail_ids.thumbnail_ids)) # to avoid duplicates
    if not requested_ids:
        raise ApplicationException(
            name="VALIDATION",
            message="At least one thumbnail ID is required.",
            statusCode=400,
        )

    thumbnails = (
        await session.exec(
            select(Thumbnails).where(Thumbnails.id.in_(requested_ids))
        )
    ).all()

    found_ids = {thumbnail.id for thumbnail in thumbnails} # set of thumbnails id
    missing_ids = [thumbnail_id for thumbnail_id in requested_ids if thumbnail_id not in found_ids]
    if missing_ids:
        raise NotFoundException(
            message=f"Thumbnail(s) not found: {', '.join(missing_ids)}"
        )

    affected_job_ids = {thumbnail.job_id for thumbnail in thumbnails} # get all job_ids of thumbnails

    for thumbnail in thumbnails:
        if thumbnail.imageKit_file_id: # if imageKit_file_id exists then delete the file from imagekit
            await asyncio.to_thread(delete_file, thumbnail.imageKit_file_id)

    await session.exec(
        delete(Thumbnails).where(Thumbnails.id.in_(requested_ids))
    )
    await delete_empty_jobs(session, affected_job_ids)
    await session.commit()

    return [
        ThumbnailDeleteResponse(
            thumbnail_id=thumbnail_id,
            message="Thumbnail deleted successfully",
        )
        for thumbnail_id in requested_ids
    ]


@router.delete('/delete/{thumbnail_id}' , response_model=ThumbnailDeleteResponse)
async def delete_thumbnail(thumbnail_id : str , session : AsyncSession = Depends(get_async_session)):
    thumbnail = await session.get(Thumbnails , thumbnail_id)

    if not thumbnail:
        raise NotFoundException(message="Thumbnail not found")

    # delete image from imagekit if exists
    if thumbnail.imageKit_file_id:
       response = await asyncio.to_thread(delete_file , thumbnail.imageKit_file_id)
       print("response" , response)

    await session.exec(
        delete(Thumbnails).where(Thumbnails.id == thumbnail_id)
    )

    await delete_empty_jobs(session , {thumbnail.job_id})
    await session.commit()

    return ThumbnailDeleteResponse(thumbnail_id=thumbnail_id, message="Thumbnail has been deleted successfully")
    

    
@router.get("/jobs/{job_id}/stream")
async def stream_job_status(job_id: str):
    logger.info(f"Received Request to Stream Job status for job id {job_id}")
    #* see important notes on SSE connection (backend/src/routes/SSE-Connection-setup-Explaination.md)

    async def event_generator(): # building and SSE Connection to stream the status of the job to the frontend
     
     from ..db.db import async_session_maker
     sent_thumnails = set()  # Keep track of thumbnails that have already been sent
    
     while True:
        
        async with async_session_maker() as session:
            job = await session.get(Job, job_id)
            if not job:
                yield f"event: {SSE_Events.FAILED.value}\ndata: {json.dumps({'error': 'Job not found'})}\n\n"
                return
            
            thumbnails = (await session.exec(
                select(Thumbnails).where(Thumbnails.job_id == job_id)
            )).all()

            for thumbnail in thumbnails:
                if thumbnail.id in sent_thumnails:
                    continue  # Skip thumbnails that have already been sent

                if thumbnail.status == 'generated':
                    logger.info(f"Thumbanil with ID {thumbnail.id} generated")
                    variants = get_variants(thumbnail.imageKit_url) if thumbnail.imageKit_url else None
                    data = json.dumps({
                        'id': thumbnail.id,
                        'style_name': thumbnail.style_name,
                        'status': thumbnail.status,
                        'imageKit_url': thumbnail.imageKit_url,
                        'variants': variants
                    })
                    yield f"event: {SSE_Events.THUMBNAIL_READY.value}\ndata: {data}\n\n"
                    sent_thumnails.add(thumbnail.id)

                elif thumbnail.status == 'failed':
                    logger.info(f"Thumbanil with ID {thumbnail.id} failed")
                    data = json.dumps({
                        'id': thumbnail.id,
                        'style_name': thumbnail.style_name,
                        'status': thumbnail.status,
                        'error_message': thumbnail.error_message
                    })
                    yield f"event: {SSE_Events.THUMBNAIL_FAILED.value}\ndata: {data}\n\n"
                    sent_thumnails.add(thumbnail.id)
                
            all_done = all(
                thumbnail.status in ("generated", "failed")
                for thumbnail in thumbnails
            )
            if all_done and len(sent_thumnails) == len(thumbnails):
                logger.info(f"all done if statement executed {all_done}")
                
                all_failed = all(t.status == JobStatus.FAILED.value for t in thumbnails)
                job_status = JobStatus.FAILED.value  if  all_failed  else  JobStatus.COMPLETED.value
                job_error =  "All thumbnails failed" if all_failed else None
                data = json.dumps({"job_id" : job_id , "status" : job_status , "job_error" :  job_error})
                yield f"event: {SSE_Events.JOB_COMPLETE.value}\ndata: {data}\n\n"
                return
            
        #* --- KEEP-ALIVE HEARTBEAT ---                                                                                                                             
        # Send an SSE comment to keep the connection open while OpenAI generates                                                                                   
        yield ": ping\n\n"        
        await asyncio.sleep(1.5) # loop runs after 1.5 seconds everytime

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "cache-control": "no-cache",
            "connection": "keep-alive",
            "x-accel-buffering": "no"
        })

