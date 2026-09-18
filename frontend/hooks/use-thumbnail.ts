import { useMutation , useQuery } from "@tanstack/react-query";
import {createJob , get_all_thumbnails , retryAllFailedThumbnails ,retryFailedThumbnail , delete_thumbnail ,batch_delete_thumbnails} from "@/lib/job"
import {CreateJob, JobQueryData } from "@/types/job"
import { ThumbnailResponse } from "@/types/thumbnails";

// ten stack query used for testing in this project only !

//* create thumbnail as job
export function useCreateJob(){
   return useMutation({
         mutationFn : (data : CreateJob) => createJob(data)
    })
  
}

//* fetch thumbails for a job (runs on refresh only)
export function useJobThumbnails(jobId:string , isGenerating : boolean = true){
    return useQuery({
        // 1. queryKey: Unique key to store & identify this data in TanStack cache                                              
        queryKey : ['thumbnails' , jobId],

        // 2. queryFn: The actual function from lib/job.ts that fetches data     
        queryFn : () => get_all_thumbnails(jobId) ,
        
        // 3. enabled: ONLY run this query if jobId exists (don't fetch if jobId is null/empty)    
        enabled: !!jobId && !isGenerating,       

        //4  how long data will remain cached 
        // prevents time-based staleness, but inactive cache data can still be removed after the default gcTime of five minutes.
        // If you also want inactive cache data to remain in memory:
        staleTime : Infinity,
        gcTime: Infinity,
        
        //5
        refetchOnWindowFocus: false,

        //6
        refetchOnReconnect: false,

      //7 It transforms the data before giving to the component
      //   │ Yes! Every single time setQueryData is called, select runs before your component gets the data.                                                                          
      select: (data): JobQueryData => ({
      ...data,
      ready: data?.thumbnails.filter((t:ThumbnailResponse) => t.status === "generated"),
      failed: data?.thumbnails.filter((t:ThumbnailResponse) => t.status === "failed"),
    }),

    })
}



//* 4 Explanation

//* suppose backend return
// data = {
//   id: "job-123",
//   status: "processing",
//   thumbnails: [
//     { id: "1", status: "generated" },
//     { id: "2", status: "failed" },
//     { id: "3", status: "generated" },
//   ],
// };

//* converted
// {
//   id: "job-123",
//   status: "processing",
//   thumbnails: [
//     { id: "1", status: "generated" },
//     { id: "2", status: "failed" },
//     { id: "3", status: "generated" }
//   ],
//   ready: [
//     { id: "1", status: "generated" },
//     { id: "3", status: "generated" }
//   ],
//   failed: [
//     { id: "2", status: "failed" }
//   ]
// }




//* retry generations for failed thumbnails

export function useRetryFailedThumbnail(){
  return useMutation({
    mutationFn : (thumbnail_id:string) => retryFailedThumbnail(thumbnail_id)
  })
}

export function useRetryAllFailedThumbnails(){
  return useMutation({
    mutationFn : (job_id:string) => retryAllFailedThumbnails(job_id)
  })

}

//* delete thumbnails
export function useDeleteThumbnail(){
  return useMutation({
    mutationFn : (thumbnail_id : string) => delete_thumbnail(thumbnail_id)
  })
}

export function useDeleteAllThumbnails(){
  return useMutation({
    mutationFn : (thumbnail_ids : string[]) => batch_delete_thumbnails(thumbnail_ids)
  })
}




                                                                                                                            
//? Line-by-Line Breakdown for useQuery                                                                                     
                                                                                                                                
    //* 1. import { useQuery } from '@tanstack/react-query'                                                                     
    // useQuery is TanStack Query's hook for fetching/reading data from the server (like GET requests).                         
                                                                                                                                
                                                                                                                                
    //* 2. queryKey: ['thumbnails', jobId]                                                                                      
    // This is the unique Cache Key array.                                                                                      
    // TanStack Query stores data in memory under this key.                                                                     
    // E.g., ['thumbnails', 'job_123'] stores the thumbnails for job_123.                                                       
    // If the component re-mounts with the same jobId, TanStack returns cached data instantly!                                  
                                                                                                                                
                                                                                                                                
    //* 3. queryFn: () => get_all_thumbnails(jobId!)                                                                            
    // This tells TanStack Query: "When this query runs, call get_all_thumbnails(jobId) to fetch data from the server."         
                                                                                                                                
                                                                                                                                
    //* 4. enabled: !!jobId                                                                                                     
    // Controls when the query is allowed to run.                                                                               
    // If jobId is null or empty (""), enabled is false $\rightarrow$ Query WILL NOT RUN.                                       
    // The moment jobId gets a value (e.g., "job_123"), enabled becomes true $\rightarrow$ Query RUNS AUTOMATICALLY.            
                                                                                                                                
                                                                                                                                
    //* 5. What TanStack Query Automatically Does For You                                                                       
                                                                                                                                
      // When you call useJobThumbnails(jobId) inside any UI component:                                                         
                                                                                                                                
      // const { data, isLoading, isError, error, refetch } = useJobThumbnails(jobId)
      
      // TanStack Query automatically tracks 5 things behind the scenes:
      
      // 1. isLoading (boolean): Starts as true while the API fetch is running. 
      // Turns false as soon as data arrives. (No need for manual setLoading(true)!)
  
      // 2. data: Holds whatever get_all_thumbnails(jobId) returned (e.g. array of thumbnails).
  
      // 3. isError & error: If the request fails, TanStack Query sets isError = true and populates error.
  
      // 4. refetch(): A function you can call manually if you want to force-refresh the data from the server.
  
      // 5. Automatic Execution: Unlike useMutation (which waits for mutate()), useQuery runs AUTOMATICALLY as soon as the component loads!   

  
//? About Caching

//* How TanStack Query Stores (cache) Data in Memory                                                                                  
                                                                                                                                
// Think of TanStack Query's internal memory (cache) like a JavaScript Key-Value Dictionary (Map):
  
    // Cache = { QueryKey:API Data Returned by queryFn }

//* Visual Example: What Gets Stored
  
// When queryFn (get_all_thumbnails('job_123')) finishes fetching data from the backend, TanStack Query stores it in memory like 
// this:
  
    //* TanStack Query Internal Cache (in browser memory)

   const DATA = {
      // Key: ['thumbnails', 'job_123']
      "['thumbnails', 'job_123']": [
        { id: "thumb_01", imageKit_url: "https://ik.imagekit.io/.../1.png", status: "completed" },
        { id: "thumb_02", imageKit_url: "https://ik.imagekit.io/.../2.png", status: "completed" }
      ],
      // Key: ['thumbnails', 'job_456'] (if another job was fetched later)
      "['thumbnails', 'job_456']": [
        { id: "thumb_03", imageKit_url: "https://ik.imagekit.io/.../3.png", status: "completed" }
      ]
    }

  //* Key Takeaways:
  
//   1. ['thumbnails', 'job_123'] is the KEY (Address):
//   It uniquely identifies which data is stored.
//   2. The array of thumbnails is the VALUE (Data):
//   Whatever your backend API returns from get_all_thumbnails is stored as the value.
//   3. Why use an array in queryKey (['thumbnails', jobId])?:
//       • thumbnails is the category.
//       • jobId makes it specific to that particular job (job_123).
//       • If jobId changes to job_456, TanStack Query looks up ['thumbnails', 'job_456'] instead!
  




//  ### Part 2: Does select run every time the cache updates?                                                                                                                  
                                                                                                                                                                             
//   │ Yes! Every single time setQueryData is called, select runs before your component gets the data.                                                                          
                                                                                                                                                                             
//   Here is the exact lifecycle inside TanStack Query:                                                                                                                         
                                                                                                                                                                             
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │      SSE Event: onThumbnailReady / onThumbnailFailed      │
// │                                                           │
// └─────────────────────────────┬─────────────────────────────┘
//                               │
//                               ▼
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │      queryClient.setQueryData(['thumbnails', jobId])      │
// │                                                           │
// └─────────────────────────────┬─────────────────────────────┘
//                               │
//                               ▼
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │ TanStack Query Cache is updated with raw thumbnails array │
// │                                                           │
// └─────────────────────────────┬─────────────────────────────┘
//                               │
//                               ▼
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │       useJobThumbnails observer detects cache change      │
// │                                                           │
// └─────────────────────────────┬─────────────────────────────┘
//                               │
//                               ▼
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │                     select(data) runs:                    │
// │                                                           │
// │        filters thumbnails into ready[] and failed[]       │
// │                                                           │
// └─────────────────────────────┬─────────────────────────────┘
//                               │
//                               ▼
// ┌───────────────────────────────────────────────────────────┐
// │                                                           │
// │      React re-renders component with transformed data     │
// │                                                           │
// └───────────────────────────────────────────────────────────┘
  
//   #### Why select runs on both backend API calls and setQueryData:
  
//   1. TanStack Query separates Storage from Delivery:
//       • The Cache stores the raw object: { id, thumbnails: [...] }.
//       • select is a projection layer that runs right before handing the data to const { data } = useJobThumbnails(...).
//   2. Whenever the cache changes from ANY source:
//       • Whether it was fetched from the backend (queryFn: () => get_all_thumbnails(jobId) on page reload)
//       • Or updated manually via queryClient.setQueryData(...) (from SSE stream)
//   TanStack Query notices the cache was touched and immediately passes the new cache data through use-thumbnail.ts:41-45:
//     select: (data): JobQueryData => ({
//       ...data,
//       ready: data?.thumbnails?.filter((t: ThumbnailResponse) => t.status === "generated") || [],
//       failed: data?.thumbnails?.filter((t: ThumbnailResponse) => t.status === "failed") || [],
//     })
  
//   3. Even with enabled: false:
//   Even though enabled: !!jobId && !isGenerating turns off automatic HTTP fetching while generating, the cache observer stays active. The moment setQueryData runs, select    
//   calculates the new ready and failed lists, and your UI updates instantaneously!

// ──────────────────────