import type { ThumbnailResultsProps } from "@/types/props";
import { ArrowUpRight, RotateCcw, Trash2 } from "lucide-react";
import { ThumbnailSkeleton } from "../ui/thumbnail-skeleton";
import { useJobThumbnails } from "@/hooks/use-thumbnail";
import {  ThumbnailResponse} from "@/types/thumbnails";
export default function ThumbnailResults({
  isGenerating,
  resultStyles,
  generationError,
  jobId,
  onRetry,
  onRetryAll,
  onDelete,
}: ThumbnailResultsProps) {
 
  //  cc4887b0-d5e2-4235-8135-4094e0cc0169

  const {data} = useJobThumbnails(jobId ?? "", isGenerating)
  const thumbnails :  ThumbnailResponse[]  = data?.ready || [];                                                
  const failedThumbnails :  ThumbnailResponse[] = data?.failed || [];  
  const stylesToRender = resultStyles.length > 0 ? resultStyles
  : [...(data?.ready || []), ...(data?.failed || [])].map(t => t.style_name);                                       
  // const generationError : string = data?.error|| "";    // string   

  const showResults =
    isGenerating ||
    thumbnails.length > 0 ||
    failedThumbnails.length > 0 ||
    Boolean(generationError);

  return (
    <>
      {showResults && (
        <section
          className="results-panel"
          aria-live="polite"
          aria-label="Generated thumbnails"
        >
          <div className="results-heading">
            <div>
              <p className="eyebrow font-mono">YOUR CREATIONS</p>
              < h2>
                {isGenerating
                  ? "Your thumbnails are taking shape"
                  : "Your thumbnails"}
              </h2>
            </div>
            <div className="results-heading-actions">
              
              {failedThumbnails.length > 1 && onRetryAll && !isGenerating && (
                <button
                  type="button"
                  className="retry-all-button font-mono"
                  onClick={onRetryAll}
                >
                  <RotateCcw aria-hidden="true" />
                  Retry all
                </button>
              )}
              {isGenerating && (
                <span className="live-status font-mono">
                  <span /> Generating
                </span>
              )}
            </div>
          </div>

          {/* Unified Grid: Loops over selectedStyles so each slot stays in place */}
          <div className="thumbnail-grid">

            {stylesToRender?.map((styleId) => {
              const friendlyStyleName = styleId?.replace(/_/g, " ");

              // 1. Success State
              const ready = thumbnails.find((t) => t.style_name === styleId);
              if (ready) {
                return (
                  <article className="thumbnail-card" key={ready.id || styleId}>
                    <div className="thumbnail-image-wrap">
                      <img
                        src={ready.imageKit_url}
                        alt={`${ready.status} generated thumbnail`}
                      />
                
                    </div>
                    <div className="thumbnail-card-info">
                      <span className="capitalize font-mono mb-2">{friendlyStyleName}</span>
                      <a
                        href={ready.imageKit_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open full size
                        <ArrowUpRight aria-hidden="true" />
                      </a>
                    </div>
                    {ready.variants && (
                      <div className="variant-row font-mono">
                        {Object.entries(ready.variants).map(([name, url]) => (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            key={name}
                          >
                            {name}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              }

              // 2. Failed State: Shows Error Card with Retry and Dismiss (Delete)
              const failed = failedThumbnails.find((f) => f.style_name === styleId);
              if (failed) {
                return (
                  <article
                    className="thumbnail-card failed-thumbnail-card"
                    key={failed.id || styleId}
                  >
                    <div className="failed-thumbnail-content">
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(styleId!)}
                          className="failed-thumbnail-dismiss"
                          aria-label={`Delete failed ${friendlyStyleName} thumbnail`}
                          title="Remove failed thumbnail"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      )}
                      <span className="failed-thumbnail-label font-mono">
                        {friendlyStyleName} Failed
                      </span>
                      <p className="failed-thumbnail-message font-mono">
                        {failed.error_message || "Generation failed"}
                      </p>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={() => onRetry(styleId!)}
                          className="failed-thumbnail-retry font-mono"
                          aria-label={`Retry ${friendlyStyleName} thumbnail`}
                        >
                          <RotateCcw aria-hidden="true" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              }

              // 3. Generating State: Show Skeleton
              if (!isGenerating) return null;

              return (
                <div className="thumbnail-result-slot" key={styleId}>
                  <ThumbnailSkeleton prompt={styleId!} isloading={isGenerating} duration={45000}  />
                </div>
              );
            })}


          </div>

          {/* Global Top-Level Job Error */}
          {generationError && (
            <div className="result-error">{generationError}</div>
          )}
        </section>
      )}

      <p className="footer-note font-mono">
        <span>✦</span>  <span className="font-mono">Your ideas, amplified</span>
      </p>
    </>
  );
}




