"use client";

import { useState } from "react";
import ThumbnailBuilder from "./thumbnail-builder";
import ThumbnailResults from "./thumbnail-results";
import type { StyleId } from "@/types/props";
import  {useRetryFailedThumbnail , useRetryAllFailedThumbnails} from '@/hooks/use-thumbnail'
import { useCallback } from "react";
import { useJobThumbnails } from "@/hooks/use-thumbnail";
import { useQueryClient } from "@tanstack/react-query";
import {startThumbnailJobStream} from '@/lib/thumbnail-job-stream'
export default function HomeClient() {

  const queryClient = useQueryClient()
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultStyles, setResultStyles] = useState<StyleId[]>([]);  // ['bold_dramatic' ,'music_concert']
  const [jobId, setJobId] = useState<string | null>(() => typeof window !== "undefined" ? sessionStorage.getItem("jobId"): null);
  const [generationError, setGenerationError] = useState("")

  // Ten stack query hooks
  const {data} = useJobThumbnails(jobId ?? "", isGenerating)
  console.log("data" , data)

  const {mutateAsync : retryFailedThumbnailsAsync} = useRetryFailedThumbnail()
  const {mutateAsync : retryAllFailedThumbnailsAsync} = useRetryAllFailedThumbnails()
 

  function handleJobStarted(styles: StyleId[]) {
    setIsGenerating(true);
    setResultStyles(styles);
    setGenerationError("");
  }

  function handleFailerAndSucess(errorMessage?: string) {
    if (errorMessage ){
    setGenerationError(errorMessage);
    }
    setIsGenerating(false);
  }


  function handleDelete(styleId: string) {
    // setResultStyles((current) => current.filter((s) => s !== styleId));
    // setFailedThumbnails((current) => current.filter((f) => f.style_name !== styleId));
    // setThumbnails((current) => current.filter((t) => t.style_name !== styleId));
  }




async function handleRetry(styleId: string) {                                                                                                                            
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


  async function handleRetryAll() {
    const failed = data?.failed
    if(!failed  || !(failed.length > 1) || !jobId ){
      return
    }

    try {
    setIsGenerating(true)


            // Optimistically mark as generating so skeleton shows up                                                                                                            
    queryClient.setQueryData(["thumbnails", jobId], (old: any) => ({                                                                                                     
          ...old,                                                                                                                                                            
          thumbnails: (old?.thumbnails || []).map((t: any) =>                                                                                                                
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
        resultStyles={resultStyles}
        generationError={generationError}

        onDelete={handleDelete}
        onRetry={handleRetry}
        onRetryAll={handleRetryAll}
      />
    </main>
  );
}