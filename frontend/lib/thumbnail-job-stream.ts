import {
  FailedPayload,
  JobCompletedPayload,
  ThumbnailFailedPayload,
  ThumbnailReadyPayload,
} from "@/types/thumbnails";
import { QueryClient } from "@tanstack/react-query";
import { subscribeToJobStatus } from "./job";

export function startThumbnailJobStream({
  jobId,
  queryClient,
  onComplete,
  onFailed,
  onError,
}: {
  jobId: string;
  queryClient: QueryClient;
  onComplete?: (data: JobCompletedPayload) => void;
  onFailed?: (error: FailedPayload) => void;
  onError?: (error: FailedPayload) => void;
}) {
  return subscribeToJobStatus(jobId, {
    onThumbnailReady : (data: ThumbnailReadyPayload) => {
      updateThumbnailInCache(queryClient, jobId, data);
    },

    onThumbnailFailed: (data: ThumbnailFailedPayload) => {
      updateThumbnailInCache(queryClient, jobId, data);
    },

    onJobComplete: (data: JobCompletedPayload) => {
      onComplete?.(data);
    },
    onFailed: (error: FailedPayload) => {
      onFailed?.(error);
    },

    onError: (error: FailedPayload) => {
      onError?.(error);
    },
  });
}

function updateThumbnailInCache(
  queryClient: QueryClient,
  jobId: string,
  data: ThumbnailReadyPayload | ThumbnailFailedPayload,
) {
  queryClient.setQueryData(["thumbnails", jobId], (old: any) => {
    const currentThumbnails: any[] = old?.thumbnails || [];

    const exists = currentThumbnails.some((t) => t.id === data.id); 
    const updatedThumbnails = exists ? currentThumbnails.map((t) => ( t.id === data.id ? { ...t, ...data } : t))
      : [...currentThumbnails, data];

    return {
      ...old,
      thumbnails: updatedThumbnails,
    };
    
  });
}


//* how data stored in cache intially when arvied from the SSE direct connection vs 





//* initially we are using this apporach which is repeatative if we call any new API

//    subscribeToJobStatus(jobResult.job_id, {

//         //* when ever SSE API fucntion call any of these function we add its data into cache

//         onThumbnailReady : (data : ThumbnailReadyPayload) => {
//            queryClient.setQueryData( // change cache data trigger due to which where this data is being used react re-renders that comp
//             ['thumbnails' , jobResult.job_id],
//             (old:any) =>({
//               ...old,
//               thumbnails: [
//           ...(old?.thumbnails || []).filter((t: any) => t.id !== data.id),
//             data   // ← { id, style_name, status: "completed", imageKit_url, variants }
//             ]
//             })
//            )
//         },

//         onThumbnailFailed:  (data :  ThumbnailFailedPayload) => {
//            queryClient.setQueryData(
//             ['thumbnails' , jobResult.job_id],
//             (old:any) =>({
//               ...old,
//                thumbnails: [
//            ...(old?.thumbnails || []).filter((t: any) => t.id !== data.id),
//                data   // ← { id, style_name, status: "failed", error_message }
//             ]
//             })
//            )
//         },

//         onJobComplete: (data) => {
//         if (data.status === "failed") {
//           onFailedOrSucess(data.error_message || "All thumbnails failed");
//         } else {
//           onFailedOrSucess();
//       }
//         },

//         onFailed : (error : FailedPayload) =>{
//            onFailedOrSucess(error.error) // set is generating to false
//         },

//         onError : (error : FailedPayload) => onFailedOrSucess(error.error)
//       });
//     } catch (err: unknown) {
