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



export const styleOptions = [
  ["bold_dramatic", "Bold & Dramatic", "#f36b45"],
  ["clean_minimal", "Clean & Minimal", "#61c6c2"],
  ["vibrant_energetic", "Vibrant & Energetic", "#f2c94c"],
  ["neon_gaming", "Neon Gaming", "#9b8cff"],
  ["tech_review", "Tech Review", "#6b9cff"],
  ["warm_lifestyle", "Warm Lifestyle", "#efaa63"],
  ["educational_documentary", "Educational Documentary", "#d4d6d8"],
  ["finance_business", "Finance & Business", "#70c58a"],
  ["beauty_glam", "Beauty & Glam", "#ee82aa"],
  ["fitness_sports", "Fitness & Sports", "#f0785d"],
  ["comedy_reaction", "Comedy Reaction", "#ffce56"],
  ["travel_adventure", "Travel & Adventure", "#60c4e8"],
  ["food_cooking", "Food & Cooking", "#e88758"],
  ["true_crime_mystery", "True Crime Mystery", "#a65f68"],
  ["motivational_selfhelp", "Motivational", "#e6bd78"],
  ["music_concert", "Music & Concert", "#d67cf2"],
  ["retro_vintage", "Retro Vintage", "#c58358"],
  ["automotive_cars", "Automotive", "#aeb8c7"],
  ["scifi_fantasy", "Sci-Fi & Fantasy", "#7b9ef7"],
  ["news_breaking", "News Breaking", "#ef5656"],
] as const;