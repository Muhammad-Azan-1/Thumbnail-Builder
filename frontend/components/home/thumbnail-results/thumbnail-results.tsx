import type { StyleId, ThumbnailResultsProps } from "@/types/props";
import { ArrowUpRight, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import styles from "./thumbnail-results.module.css";
import { ThumbnailSkeleton } from "../../ui/thumbnail-skeleton/thumbnail-skeleton";
import {  ThumbnailResponse} from "@/types/thumbnails";
import { useJobThumbnails } from "@/hooks/use-thumbnail";

export default function ThumbnailResults({
  data,
  isGenerating,
  isDeleting = false,
  resultStyles,
  generationError,
  onRetry,
  onRetryAll,
  onDelete,
  onDeleteAll,
}: ThumbnailResultsProps) {
 

  const readythumbnails :  ThumbnailResponse[]  = data?.ready || [];                                                
  const failedThumbnails :  ThumbnailResponse[] = data?.failed || [];  
  const stylesToRender = resultStyles.length > 0 ? resultStyles : data?.thumbnails.map((t : ThumbnailResponse) => t.style_name as StyleId); 
  const globalError = generationError || data?.error_message || "";
  console.log("global error" , generationError)
  console.log("data?.error_messager" , data?.error_message)

  const showResults =
    isGenerating ||
    readythumbnails.length > 0 ||
    failedThumbnails.length > 0 ||
    Boolean(globalError);;

  return (
    <>
      {showResults && (
        <section
          className={styles.resultsPanel}
          aria-live="polite"
          aria-label="Generated thumbnails"
        >
          <div className={styles.resultsHeading}>
            <div>
              <p className="eyebrow font-mono">YOUR CREATIONS</p>
              < h2>
                {isGenerating
                  ? "Your thumbnails are taking shape"
                  : "Your thumbnails"}
              </h2>
            </div>
            <div className={styles.resultsHeadingActions}>
              
              {/* retry all failed thumbnails */}
              {failedThumbnails.length > 1 && onRetryAll && !isGenerating && (
                <button
                  type="button"
                  className={`${styles.retryAllButton} font-mono`}
                  onClick={onRetryAll}
                  disabled={isDeleting}
                >
                  <RotateCcw aria-hidden="true" />
                  Retry all
                </button>
              )}

              {/* delete all */}
              {Boolean(data?.thumbnails && data.thumbnails.length > 0) && onDeleteAll && !isGenerating && (
                <button
                  type="button"
                  className={`${styles.deleteAllButton} font-mono`}
                  onClick={onDeleteAll}
                  disabled={isDeleting}
                  title="Delete all thumbnails"
                >
                  <Trash2 aria-hidden="true" />
                  {isDeleting ? "Deleting..." : "Delete all"}
                </button>
              )}


              {isGenerating && (
                <span className={`${styles.liveStatus} font-mono`}>
                  <span /> Generating
                </span>
              )}
            </div>
          </div>

          {/* Unified Grid: Loops over selectedStyles so each slot stays in place */}
          <div className={styles.thumbnailGrid}>

            {stylesToRender?.map((styleId : StyleId) => {
              const friendlyStyleName = styleId?.replace(/_/g, " ");

              // 1. Success State
              const ready = readythumbnails.find((t) => t.style_name === styleId);
              if (ready) {
                return (
                  <article className={styles.thumbnailCard} key={ready.id || styleId}>
                    <div className={styles.thumbnailImageWrap}>
                      <img
                        src={ready.imageKit_url}
                        alt={`${ready.status} generated thumbnail`}
                      />
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(ready.id, styleId)}
                          disabled={isDeleting || isGenerating}
                          className={styles.thumbnailCardDeleteBtn}
                          aria-label={`Delete ${friendlyStyleName} thumbnail`}
                          title="Delete thumbnail"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      )}
                
                    </div>
                    <div className={styles.thumbnailCardInfo}>
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
                      <div className={`${styles.variantRow} font-mono`}>
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
                    className={`${styles.thumbnailCard} ${styles.failedThumbnailCard}`}
                    key={failed.id || styleId}
                  >
                    <div className={styles.failedThumbnailContent}>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(failed.id, styleId!)}
                          disabled={isDeleting || isGenerating}
                          className={styles.failedThumbnailDismiss}
                          aria-label={`Delete failed ${friendlyStyleName} thumbnail`}
                          title="Remove failed thumbnail"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      )}
                      <span className={`${styles.failedThumbnailLabel} font-mono`}>
                        {friendlyStyleName} Failed
                      </span>
                      <p className={`${styles.failedThumbnailMessage} font-mono`}>
                        {failed.error_message || "Generation failed"}
                      </p>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={() => onRetry(styleId!)}
                          className={`${styles.failedThumbnailRetry} font-mono`}
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
                <div className={styles.thumbnailResultSlot} key={styleId}>
                  <ThumbnailSkeleton prompt={styleId!} isloading={isGenerating} duration={45000}  />
                </div>
              );
            })}


          </div>

          {/* Global Top-Level Job Error */}
          {globalError && (
            <div className={`${styles.resultError} font-mono font-bold`} role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{globalError}</span>
            </div>
          )}
        </section>
      )}

      <p className={`${styles.footerNote} font-mono`}>
        <span>✦</span>  <span className="font-mono">Your ideas, amplified</span>
      </p>
    </>
  );
}



