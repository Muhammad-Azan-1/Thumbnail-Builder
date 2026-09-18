import { FETCH_API_METHOD } from "./client";
import { CreateJob, CreateJobResponse, RetryThumbnailResponse  , JobResponse} from '../types/job'
import {SSE_EVENTS} from '../types/SSE_Events'
import {JobEventHandlers } from '../types/thumbnails'

import { BASE_API } from "./client";

// createjob -> call backend to create all thumbnails (which lies in that job)
export async function createJob(data:CreateJob){
    return await FETCH_API_METHOD<CreateJobResponse>("/job" ,{
    method : 'POST',
    body : JSON.stringify(data)
    })
}



// get all thumbnails for a job id
export async function get_all_thumbnails(job_id : string){
    return await FETCH_API_METHOD<JobResponse>(`/job/${job_id}` , {
        method : "GET",
    })
}


//retry single failed thumbnails
export async function retryFailedThumbnail(thumbnailId: string) {
    return await FETCH_API_METHOD<RetryThumbnailResponse>(`/retry/thumbnail/${thumbnailId}`, {
        method: 'POST',
    });
}

//retry All failed thumbnails
export async function retryAllFailedThumbnails(jobId: string) {
    return await FETCH_API_METHOD(`/retry/job/${jobId}`, {
        method: 'POST',
    });
}



// delete batch thumbnails
export async function batch_delete_thumbnails(thumbnail_ids: string[]){
    return await FETCH_API_METHOD(`/batch-delete` , {
        body : JSON.stringify({'thumbnail_ids' : thumbnail_ids}),
        method : "DELETE"
    })

}

// delete single thumbnails
export async function delete_thumbnail(thumbnail_id : string){
    return await FETCH_API_METHOD(`/delete/${thumbnail_id}` , {
        method : "DELETE"
    })

}


// SSE connection to get the status in real time
export function subscribeToJobStatus(
    job_id: string,
    { onThumbnailReady, onThumbnailFailed, onJobComplete, onFailed , onError }: JobEventHandlers
) {

    const es = new EventSource(`${BASE_API}/jobs/${job_id}/stream`)


    es.addEventListener(SSE_EVENTS.THUMBNAIL_READY , (event: MessageEvent<string>)=>{
        console.log("THUMBANIL EVENT DATA RECEIVED : ", event )
        onThumbnailReady(JSON.parse(event.data))
    })

    es.addEventListener(SSE_EVENTS.THUMBNAIL_FAILED , (event: MessageEvent<string>)=>{
        console.log("THUMBANIL EVENT FAILED DATA RECEIVED : ", event )
        onThumbnailFailed(JSON.parse(event.data))
    })

    es.addEventListener(SSE_EVENTS.JOB_COMPLETE ,(event: MessageEvent<string>)=>{
        console.log("JOB EVENT COMPLETION DATA RECEIVED : ", event  , "data :" , JSON.parse(event.data))
        onJobComplete(JSON.parse(event.data))
        es.close()
    })

    es.addEventListener(SSE_EVENTS.FAILED ,(event: MessageEvent<string>)=>{
        console.log("JOB FAILED EVENT DATA RECEIVED : ", event )
        onFailed(JSON.parse(event.data))
        es.close()
    })

    es.onerror = (err)=>{
          // If the browser is attempting to reconnect, don't destroy it!
            if (es.readyState === EventSource.CONNECTING) {
                console.log("SSE connection interrupted. Reconnecting...");
                return;
            }
  
            // Only tear down if the server permanently closed it
            console.error("SSE Connection failed permanently", err);
            es.close();
            onError({error : "sse connection get failed"});
    }
    
}