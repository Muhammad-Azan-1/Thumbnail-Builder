import type { ThumbnailReadyPayload, ThumbnailFailedPayload } from "./thumbnails";
import type { Dispatch, SetStateAction } from "react";
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
  onThumbnailReady: (data: ThumbnailReadyPayload) => void;
  onThumbnailFailed: (data: ThumbnailFailedPayload) => void;
  onJobComplete: (data : string) => void;
  onFailed: (error: string) => void;
  onError : () => void;
  setSelectedStyles: Dispatch<SetStateAction<StyleId[]>>;
  selectedStyles : StyleId[]
  isGenerating: boolean;
}


export interface ThumbnailResultsProps {
  isGenerating: boolean;
  resultStyles: StyleId[];
  thumbnails: ThumbnailReadyPayload[];
  failedThumbnails: ThumbnailFailedPayload[];
  generationError: string;
  onRetry?: (styleId: string) => void;
  onRetryAll?: () => void;
  onDelete?: (styleId: string) => void;
}
