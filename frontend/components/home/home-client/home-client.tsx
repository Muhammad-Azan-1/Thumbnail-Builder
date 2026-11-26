"use client";

import { useState } from "react";
import ThumbnailBuilder from "../thumbnail-builder/thumbnail-builder";
import ThumbnailResults from "../thumbnail-results/thumbnail-results";
import type { StyleId } from "@/types/props";
import  {useRetryFailedThumbnail , useRetryAllFailedThumbnails , useDeleteThumbnail, useDeleteAllThumbnails} from '@/hooks/use-thumbnail'
import { useJobThumbnails } from "@/hooks/use-thumbnail";
import { useQueryClient } from "@tanstack/react-query";
import {startThumbnailJobStream} from '@/lib/thumbnail-job-stream'
import { useEffect } from "react";
import { RateLimitError } from "@/lib/rateLimit";
import type { ThumbnailCooldownKey, ThumbnailRateLimitErrors } from "@/types/props";
import { useThumbnailCooldowns } from "@/components/ui/use-thumbnail-cooldowns";
import ThumbnailDeleteDialog from "../thumbnail-delete-dialog/thumbnail-delete-dialog";

type PendingDelete =
  | { kind: "single"; thumbnailId: string; styleId?: string; styleName?: string }
  | { kind: "all"; thumbnailIds: string[] };

export default function HomeClient() {

  const queryClient = useQueryClient()



  //* local states
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultStyles, setResultStyles] = useState<StyleId[]>([]); 
  const [jobId, setJobId] = useState<string | null>(() => typeof window !== "undefined" ? sessionStorage.getItem("jobId"): null);
  const [generationError, setGenerationError] = useState<string>('')

  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteError, setDeleteError] = useState("");

  
  const [rateLimitErrors, setRateLimitErrors] = useState<ThumbnailRateLimitErrors>({});
  const { cooldowns, showMessage: showCooldownMessage, secondsRemaining: cooldownSecondsRemaining } = useThumbnailCooldowns(rateLimitErrors);

  //* Ten stack query hooks
  
  const {data , isError, error} = useJobThumbnails(jobId ?? "" , isGenerating)
  const isJobInProgress = isGenerating || Boolean(data?.thumbnails.some(
    (thumbnail) => thumbnail.status === "pending" || thumbnail.status === "generating",
  ));

  function clearRateLimitError(key: ThumbnailCooldownKey) {
    setRateLimitErrors((current) => ({ ...current, [key]: undefined }));
  }

  function captureRateLimit(error: unknown, key: ThumbnailCooldownKey): boolean {
    if (!(error instanceof RateLimitError)) return false;

    setRateLimitErrors((current) => ({ ...current, [key]: error }));
    void queryClient.invalidateQueries({ queryKey: ["cooldown"] });
    return true;
  }


  const {mutateAsync : retryFailedThumbnailsAsync} = useRetryFailedThumbnail()
  const {mutateAsync : retryAllFailedThumbnailsAsync} = useRetryAllFailedThumbnails()

  const { mutateAsync : deleteThumbnailsAsync} = useDeleteThumbnail()
  const { mutateAsync : deleteAllThumbnailsAsync} = useDeleteAllThumbnails()


 
  // Handle 404 or query errors from invalid jobId
  useEffect(() => {
    if (isError && error) {
      console.error("Failed to load job:", error.message);
      setGenerationError(error.message);
      sessionStorage.removeItem("jobId");
      setJobId(null);
    }
  }, [isError, error]);
  

  function handleJobStarted(styles: StyleId[]) {
    setIsGenerating(true);
    setResultStyles(styles);
    setGenerationError("");
    setJobId(null)
  }

  function handleFailerAndSucess(errorMessage?: string | null)  {
    if (errorMessage ){
    setGenerationError(errorMessage);
    }
    setIsGenerating(false);
  }


  //* delete handlers
  function handleDelete(thumbnailId: string, styleId?: string): void {
    if (!thumbnailId || !jobId || isJobInProgress || isDeleting || cooldowns.deleteSingle.isActive) return;
    setDeleteError("");
    setPendingDelete({ kind: "single", thumbnailId, styleId, styleName: styleId });
  }

  function handleDeleteAll(): void {
    if (!jobId || !data?.thumbnails?.length || isJobInProgress || isDeleting || cooldowns.deleteAll.isActive) return;

    const thumbnailIds = data.thumbnails.map((t) => t.id);
    if (thumbnailIds.length === 0) return;

    setDeleteError("");
    setPendingDelete({ kind: "all", thumbnailIds });
  }

  async function confirmDelete(): Promise<void> {
    const cooldownKey = pendingDelete?.kind === "all" ? "deleteAll" : "deleteSingle";
    if (!pendingDelete || !jobId || isDeleting || cooldowns[cooldownKey].isActive) return;

    setIsDeleting(true);
    setDeleteError("");
    clearRateLimitError(cooldownKey);
    try {
      if (pendingDelete.kind === "single") {
        await deleteThumbnailsAsync(pendingDelete.thumbnailId);

        queryClient.setQueryData(["thumbnails", jobId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            thumbnails: (old.thumbnails || []).filter(
              (thumbnail: any) => thumbnail.id !== pendingDelete.thumbnailId,
            ),
          };
        });

        if (pendingDelete.styleId) {
          setResultStyles((current) =>
            current.filter((style) => style !== pendingDelete.styleId),
          );
        }

        const current = queryClient.getQueryData<any>(["thumbnails", jobId]);
        if (!current?.thumbnails?.length) {
          sessionStorage.removeItem("jobId");
          setJobId(null);
          setResultStyles([]);
        }


      } else {

        await deleteAllThumbnailsAsync(pendingDelete.thumbnailIds);
        queryClient.removeQueries({ queryKey: ["thumbnails", jobId] });
        sessionStorage.removeItem("jobId");
        setJobId(null);
        setResultStyles([]);
      }

      setPendingDelete(null);
    } catch (error) {
      captureRateLimit(error, cooldownKey);
      setDeleteError(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }


//* retry handlers
async function handleRetry(styleId: string) :  Promise<void>  {                                                                                                                            
      const failed = data?.failed?.find((t) => t.style_name === styleId);                                                                                                    
      if (!failed || !jobId || cooldowns.retrySingle.isActive) return;
                                                                                                                                                                             
      try {                                                                                                                                                                  
        clearRateLimitError("retrySingle");
        setGenerationError("");
        setIsGenerating(true);                                                                                                                                               
                                                                                                                                                                             
        const response = await retryFailedThumbnailsAsync(failed.id);                                                                                                        

        // Mark the thumbnail as generating only after the API accepts the retry.
        queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({
          ...old,
          thumbnails: (old?.thumbnails || []).map((thumbnail: any) =>
            thumbnail.job_id === jobId && thumbnail.id === failed.id
              ? { ...thumbnail, status: "generating", error_message: undefined }
              : thumbnail,
          ),
        }));
                                                                                                                                                                             
        startThumbnailJobStream({                                                                                                                                            
          jobId,                                                                                                                                   
          queryClient,                                                                                                                                                       
          onComplete: (res) => {                                                                                                                                             
            if (res.status === "failed") {                                                                                                                                   
              handleFailerAndSucess(res.job_error);                                                                          
            } else {                                                                                                                                                         
              handleFailerAndSucess();                                                                                                                                       
            }                                                                                                                                                                
          },                                                                                                                                                                 
          onFailed: (err) => handleFailerAndSucess(err.error),                                                                                                               
          onError: (err) => handleFailerAndSucess(err.error),                                                                                                                
        });      
        
        
      } catch (error) {   
        if (captureRateLimit(error, "retrySingle")) {
          setIsGenerating(false);
        } else {
          handleFailerAndSucess(error instanceof Error ? error.message : "Retry failed");
        }
      }                                                                                                                                                                      
    }         


async function handleRetryAll() : Promise<void> {
    const failed = data?.failed
    if(!failed  || !(failed.length > 0) || !jobId || cooldowns.retryAll.isActive ){
      return
    }
    try {
    clearRateLimitError("retryAll");
    setGenerationError("");
    setIsGenerating(true)

    const response = await retryAllFailedThumbnailsAsync(jobId)

    // Mark failed thumbnails as generating only after the API accepts the retry.
    queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({
      ...old,
      thumbnails: (old?.thumbnails || []).map((thumbnail: any) =>
        thumbnail.job_id === jobId && thumbnail.status === "failed"
          ? { ...thumbnail, status: "generating", error_message: undefined }
          : thumbnail,
      ),
    }));

    startThumbnailJobStream({
      jobId,
      queryClient,
      onComplete : (res) =>{
        if (res.status == 'failed'){
           handleFailerAndSucess(res.job_error );           
        }else{
          setIsGenerating(false)
        }
      },
      onFailed : (error)=> handleFailerAndSucess(error.error),
      onError : (error) => handleFailerAndSucess(error.error)
      
    })

    } catch (error) {
       if (captureRateLimit(error, "retryAll")) {
         setIsGenerating(false);
       } else {
        handleFailerAndSucess(error instanceof Error  ? error.message : "Retry failed")
       }
    }


}                                                          




  return (
    <main>
  
      <ThumbnailBuilder
        data={data}
        onJobStarted={handleJobStarted}
        onJobCreated={setJobId}
        onFailedOrSucess={handleFailerAndSucess}
        isGenerating={isJobInProgress}
      />

      {/* Bottom Results Component (Appears when generating or when thumbnails exist) */}
      <ThumbnailResults
        data={data}
        isGenerating={isJobInProgress}
        isDeleting={isDeleting}
        resultStyles={resultStyles}
        generationError={generationError}
        
        cooldowns={cooldowns}
        showCooldownMessage={showCooldownMessage}
        cooldownSecondsRemaining={cooldownSecondsRemaining}

        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onRetry={handleRetry}
        onRetryAll={handleRetryAll}
      />

      <ThumbnailDeleteDialog
        open={pendingDelete !== null}
        target={pendingDelete}
        isPending={isDeleting}
        isCooldownActive={pendingDelete?.kind === "all"
          ? cooldowns.deleteAll.isActive
          : cooldowns.deleteSingle.isActive}
        error={deleteError}

        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
            setDeleteError("");
          }
        }}
        onConfirm={() => void confirmDelete()}
      />

  
    </main>
  );
}
