

interface Variants {
    [key: string]: string;
}

interface ThumbnailReadyPayload {
    id: string;
    style_name: string;
    status: string;
    imageKit_url : string;
    variants: Variants;
}

interface ThumbnailFailedPayload {
    id : string;
    style_name: string;
    status : string;
    error_message : string;
}



interface ThumbnailResponse {
  id: string;
  job_id: string;
  style_name?: string;
  status: string;
  imageKit_url?: string;
  error_message?: string;
  variants?: Record<string, string>;
  created_at: string;
}



interface FailedPayload{
 error : string
}

interface JobCompletedPayload {
job_id : string,
status : string,
job_error : string


}

// Create an interface for the destructured object
interface JobEventHandlers {
    onThumbnailReady : (data: ThumbnailReadyPayload) => void;
    onThumbnailFailed : (error: ThumbnailFailedPayload) => void;
    onJobComplete : (data : JobCompletedPayload) => void;
    onFailed : (error: FailedPayload) => void;
    onError  : (error : FailedPayload) => void;
}

export type {
    Variants,
    ThumbnailReadyPayload,
    ThumbnailFailedPayload,
    ThumbnailResponse,
    FailedPayload,
    JobEventHandlers,
    JobCompletedPayload
};

