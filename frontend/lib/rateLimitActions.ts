export const RATE_LIMIT_ACTIONS = {
  auth: {
    register: "POST /auth/register",
    verifyEmail: "POST /auth/verify-email",
    login: "POST /auth/login",
    resendEmailVerification: "POST /auth/resend-email-verification",
    refreshAccessToken: "POST /auth/refresh-access-token",
    forgotPasswordVerification: "POST /auth/forgot-password-verfication",
    resetPassword: "POST /auth/reset-password",
    googleAuth: "POST /auth/google-auth",
  },
  thumbnails: {
    uploadHeadshot: "POST /thumbnails/upload-headshot",
    createJob: "POST /thumbnails/job",
    getJob: "GET /thumbnails/job/{job_id}",
    retryThumbnail: "POST /thumbnails/retry/thumbnail/{thumbnail_id}",
    retryJob: "POST /thumbnails/retry/job/{job_id}",
  },
} as const;
