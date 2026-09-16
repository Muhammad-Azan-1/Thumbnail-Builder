
interface CreateJob {
user_prompt : string,
headshot_url : string,
styles : string[],
num_of_thumbnails : number
}

interface CreateJobResponse {
	job_id: string;
}

interface RetryThumbnailResponse {
	thumbnail_id: string;
	job_id: string;
	status: string;
}

export type { CreateJob, CreateJobResponse, RetryThumbnailResponse };