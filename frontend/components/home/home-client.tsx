"use client";

import { useState } from "react";
import ThumbnailBuilder from "./thumbnail-builder";
import ThumbnailResults from "./thumbnail-results";
import { subscribeToJobStatus } from "@/lib/job";
import type { StyleId } from "@/types/props";
import  {useRetryFailedThumbnails , useRetryAllFailedThumbnails} from '@/hooks/use-thumbnail'
import { useCallback } from "react";

export default function HomeClient() {
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultStyles, setResultStyles] = useState<StyleId[]>([]);  // ['bold_dramatic' ,'music_concert']
  const [jobId, setJobId] = useState<string | null>(null);


  // const [thumbnails, setThumbnails] = useState<ThumbnailReadyPayload[]>([]);
  // const [failedThumbnails, setFailedThumbnails] = useState<ThumbnailFailedPayload[]>([]); // {id : '1' ,style_name : "bold_dramatic" , status : "failed" , error_message : "something went wrong" },{id : '2' , style_name : "music_concert" , status : "failed" , error_message : "something went wrong" }
  const [generationError, setGenerationError] = useState("");


  // Ten stack query hooks
    const {mutateAsync : retryFailedThumbnailsAsync} = useRetryFailedThumbnails()
    const {mutateAsync : retryAllFailedThumbnailsAsync} = useRetryAllFailedThumbnails()
 

  function handleJobStarted(styles: StyleId[]) {
    setIsGenerating(true);
    setResultStyles(styles);
  }


  function handleJobCreated(createdJobId: string) {
    setJobId(createdJobId);
  }


  function handleFailed(errorMessage: string) {
    setGenerationError(errorMessage);
    setIsGenerating(false);
  }



  //!



  // function handleDelete(styleId: string) {
  //   setResultStyles((current) => current.filter((s) => s !== styleId));
  //   setFailedThumbnails((current) => current.filter((f) => f.style_name !== styleId));
  //   setThumbnails((current) => current.filter((t) => t.style_name !== styleId));
  // }




  // async function handleRetry(styleId: string) {
  //   const failed = failedThumbnails.find((thumbnail) => thumbnail.style_name === styleId);
  //   if (!failed) return;

  //   try {
  //     // const response = await retryThumbnail(failed.id);
  //     const response = await retryFailedThumbnailsAsync(failed.id)
  //     setIsGenerating(true);
  //     setFailedThumbnails((current) => current.filter((item) => item.style_name !== styleId));
  //     subscribeToJobStatus(response.job_id, {
  //       onThumbnailReady: handleThumbnailReady,
  //       onThumbnailFailed: handleThumbnailFailed,
  //       onJobComplete: () => setIsGenerating(false),
  //       onFailed: (error) => handleFailed(error.error),
  //       onError: handleError,
  //     });
  //   } catch (error) {
  //     handleFailed(error instanceof Error ? error.message : "Retry failed");
  //   }
  // }



  // async function handleRetryAll() {
  //   if (!jobId || failedThumbnails.length < 2) return;

  //   try {
  //     const repsonse = await retryAllFailedThumbnailsAsync(jobId);
  //     setIsGenerating(true);
  //     setFailedThumbnails([]);
  //     subscribeToJobStatus(jobId, {
  //       onThumbnailReady: handleThumbnailReady,
  //       onThumbnailFailed: handleThumbnailFailed,
  //       onJobComplete: () => setIsGenerating(false),
  //       onFailed: (error) => handleFailed(error.error),
  //       onError: handleError,
  //     });
  //   } catch (error) {
  //     handleFailed(error instanceof Error ? error.message : "Retry failed");
  //   }
  // }

  return (
    <main className="studio-shell">
      <div className="grain" aria-hidden="true" />
      <header className="studio-header">
        <div className="brand-mark" aria-hidden="true">
          TB
        </div>
        <div>
          <p className="eyebrow font-mono">AI CREATIVE STUDIO</p>
          <h1>Thumbnail Builder</h1>
          <p className="font-mono subtitle">Generate YouTube thumbnails with AI</p>
        </div>
        <div className="header-status font-mono">
          <span /> Ready to create
        </div>
      </header>

      {/* Main Form Builder Component */}
      <ThumbnailBuilder
        onJobStarted={handleJobStarted}
        onJobCreated={handleJobCreated}
        onFailed={handleFailed}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />

      {/* Bottom Results Component (Appears when generating or when thumbnails exist) */}
      <ThumbnailResults
        isGenerating={isGenerating}
        resultStyles={resultStyles}
        jobId={jobId}

        thumbnails={thumbnails}
        failedThumbnails={failedThumbnails}
        generationError={generationError}

        onDelete={handleDelete}
        onRetry={handleRetry}
        onRetryAll={handleRetryAll}
      />
    </main>
  );
}