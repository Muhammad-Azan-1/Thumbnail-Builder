
import { JobResponse } from "./job";
import { JobQueryData } from "./job";
export type StyleId =
  | "bold_dramatic"
  | "clean_minimal"
  | "vibrant_energetic"
  | "neon_gaming"
  | "tech_review"
  | "warm_lifestyle"
  | "educational_documentary"
  | "finance_business"
  | "beauty_glam"
  | "fitness_sports"
  | "comedy_reaction"
  | "travel_adventure"
  | "food_cooking"
  | "true_crime_mystery"
  | "motivational_selfhelp"
  | "music_concert"
  | "retro_vintage"
  | "automotive_cars"
  | "scifi_fantasy"
  | "news_breaking";


export interface ThumbnailBuilderProps {
  onJobStarted: (styles: StyleId[]) => void;
  onJobCreated: (jobId: string) => void;
  onFailedOrSucess: (error?: string) => void;
  isGenerating: boolean;
  data?: JobQueryData
}


export interface ThumbnailResultsProps {
  isGenerating: boolean;
  resultStyles: StyleId[];
  generationError: string;
  onRetry?: (styleId: string) => void;
  onRetryAll?: () => void;
  onDelete?: (styleId: string) => void;
  data?: JobQueryData
}
