"use client";

import { useState } from "react";
import ThumbnailBuilder from "./thumbnail-builder";
import ThumbnailResults from "./thumbnail-results";
import type { StyleId } from "@/types/props";
import  {useRetryFailedThumbnail , useRetryAllFailedThumbnails , useDeleteThumbnail, useDeleteAllThumbnails} from '@/hooks/use-thumbnail'
import { useJobThumbnails } from "@/hooks/use-thumbnail";
import { useQueryClient } from "@tanstack/react-query";
import {startThumbnailJobStream} from '@/lib/thumbnail-job-stream'
import { useEffect } from "react";
export default function HomeClient() {

  const queryClient = useQueryClient()
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resultStyles, setResultStyles] = useState<StyleId[]>([]);  // ['bold_dramatic' ,'music_concert']
  const [jobId, setJobId] = useState<string | null>(() => typeof window !== "undefined" ? sessionStorage.getItem("jobId"): null);
  // const [jobId, setJobId] = useState<string | null >('133d56d2-cc00-4b94-9c15-ab2599af9ebf');
  const [generationError, setGenerationError] = useState("")

  // Ten stack query hooks
  const {data , isError, error} = useJobThumbnails(jobId ?? "" , isGenerating)
  console.log("data" , data , "IsError" , isError , "Error" ,error)

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
  }

  function handleFailerAndSucess(errorMessage?: string)  {
    if (errorMessage ){
    setGenerationError(errorMessage);
    }
    setIsGenerating(false);
  }


  async function handleDelete(thumbnailId: string, styleId?: string): Promise<void> {
    if (!thumbnailId || isGenerating || isDeleting) return;

    try {
      setIsDeleting(true);
      setGenerationError("");

      await deleteThumbnailsAsync(thumbnailId);

      // Optimistically remove from TanStack Query cache
      queryClient.setQueryData(["thumbnails", jobId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          thumbnails: (old.thumbnails || []).filter((t: any) => t.id !== thumbnailId),
        };
      });

      // Remove styleId from resultStyles if tracked
      if (styleId) {
        setResultStyles((current) => current.filter((s) => s !== styleId));
      }

      // If no thumbnails left, clear job session & reset state
      const current = queryClient.getQueryData<any>(["thumbnails", jobId]);
      if (!current?.thumbnails || current.thumbnails.length === 0) {
        sessionStorage.removeItem("jobId");
        setJobId(null);
        setResultStyles([]);
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteAll(): Promise<void> {
    if (!jobId || !data?.thumbnails?.length || isGenerating || isDeleting) return;

    const thumbnailIds = data.thumbnails.map((t) => t.id);
    if (thumbnailIds.length === 0) return;

    try {
      setIsDeleting(true);
      setGenerationError("");

      await deleteAllThumbnailsAsync(thumbnailIds);

      // Clear cache and reset state
      // queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({
      //   ...old,
      //   thumbnails: [],
      // }));

      queryClient.removeQueries({ queryKey: ["thumbnails", jobId]  });

      sessionStorage.removeItem("jobId");
      setJobId(null);
      setResultStyles([]);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Delete all failed");
    } finally {
      setIsDeleting(false);
    }
  }


async function handleRetry(styleId: string) :  Promise<void>  {                                                                                                                            
      const failed = data?.failed?.find((t) => t.style_name === styleId);                                                                                                    
      if (!failed || !jobId) return;                                                                                                                                         
                                                                                                                                                                             
      try {                                                                                                                                                                  
        setIsGenerating(true);                                                                                                                                               
                                                                                                                                                                             
        // Optimistically mark as generating so skeleton shows up                                                                                                            
        queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({                                                                                                     
          ...old,                                                                                                                                                            
          thumbnails: (old?.thumbnails || []).map((t: any) =>                                                                                                                
            t.id === failed.id ? { ...t, status: "generating", error_message: undefined } : t  // on retry mark the failed thumbnail as generated                                                                               
          ),                                                                                                                                                                 
        }));                                                                                                                                                                 
                                                                                                                                                                             
        const response = await retryFailedThumbnailsAsync(failed.id);                                                                                                        
                                                                                                                                                                             
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
        handleFailerAndSucess(error instanceof Error ? error.message : "Retry failed");                                                                                      
      }                                                                                                                                                                      
    }         


async function handleRetryAll() : Promise<void> {
    const failed = data?.failed
    if(!failed  || !(failed.length > 1) || !jobId ){
      return
    }
    try {
    setIsGenerating(true)

    // Optimistically mark as generating so skeleton shows up                                                                                                            
    queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({                                                                                                     
          ...old,                                                                                                                                                            
          thumbnails : (old?.thumbnails || []).map((t: any) =>                                                                                                                
            t.job_id == jobId && t.status == 'failed' ? { ...t, status: "generating", error_message: undefined } : t  // on retry mark the failed thumbnail as generated                                                                               
          ),                                                                                                                                                                 
        }));                                                                                                                                                                 
                       
    const response = await retryAllFailedThumbnailsAsync(jobId)

    startThumbnailJobStream({
      jobId,
      queryClient,
      onComplete : (res) =>{
        if (data.error_message){
           handleFailerAndSucess(res.job_error );           
        }else{
          setIsGenerating(false)
        }
      },
      onFailed : (error)=> handleFailerAndSucess(error.error),
      onError : (error) => handleFailerAndSucess(error.error)
      
    })

    } catch (error) {
        handleFailerAndSucess(error instanceof Error  ? error.message : "Retry failed")
    }


}                                                          


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
        data={data}
        onJobStarted={handleJobStarted}
        onJobCreated={setJobId}
        onFailedOrSucess={handleFailerAndSucess}
        isGenerating={isGenerating}
      />

      {/* Bottom Results Component (Appears when generating or when thumbnails exist) */}
      <ThumbnailResults
        data={data}
        isGenerating={isGenerating}
        isDeleting={isDeleting}
        resultStyles={resultStyles}
        generationError={generationError}

        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onRetry={handleRetry}
        onRetryAll={handleRetryAll}
      />
    </main>
  );
}