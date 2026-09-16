

interface Variants {
    [key: string]: string;
}

export interface ThumbnailReadyPayload {
    id: string;
    style_name: string;
    status: string;
    imageKit_url : string;
    variants: Variants;
}

export interface ThumbnailFailedPayload {
    id : string;
    style_name: string;
    status : string;
    error_message : string;
}


interface JobCompletedPayload {
    job_id : string,
    status : string,
    
}

interface FailedPayload{
 error : string
}

// Create an interface for the destructured object
export interface JobEventHandlers {
    onThumbnailReady : (data: ThumbnailReadyPayload) => void;
    onThumbnailFailed : (error: ThumbnailFailedPayload) => void;
    onJobComplete : (data : JobCompletedPayload) => void;
    onFailed : (error: FailedPayload) => void;
   onError  : () => void;
}


