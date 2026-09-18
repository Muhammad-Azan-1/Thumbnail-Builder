import { ThumbnailResponse } from "./thumbnails";

interface CreateJob {
  user_prompt: string;
  headshot_url: string;
  styles: string[];
  num_of_thumbnails: number;
}

interface CreateJobResponse {
  job_id: string;
}

interface RetryThumbnailResponse {
  thumbnail_id: string;
  job_id: string;
  status: string;
}

interface JobResponse {
  id: string;
  user_prompt: string;
  status: string;
  num_of_thumbnails: number;
  headshot_url: string;
  created_at: string;
  error_message?: string;
  thumbnails: ThumbnailResponse[];
}

interface JobQueryData extends JobResponse {
  ready: ThumbnailResponse[];
  failed: ThumbnailResponse[];
}
export type {
  CreateJob,
  CreateJobResponse,
  RetryThumbnailResponse,
  JobResponse,
  JobQueryData,
};


// {
//   // inherited from JobResponse
//   id: string;
//   user_prompt: string;
//   status: string;
//   num_of_thumbnails: number;
//   headshot_url: string;
//   created_at: string;
//   error_message?: string;
//   thumbnails: ThumbnailResponse[];

//   // added by TanStack Query select
//   ready: ThumbnailResponse[];
//   failed: ThumbnailResponse[];
// // }