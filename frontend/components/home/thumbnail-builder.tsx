"use client";
import { useQueryClient } from "@tanstack/react-query";


import {
  ChangeEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useUploadHeadshot } from "@/hooks/use-upload-headshot";
import { useCreateJob } from "@/hooks/use-thumbnail";
import { subscribeToJobStatus } from "@/lib/job";
import type { StyleId, ThumbnailBuilderProps } from "@/types/props";
import {ThumbnailReadyPayload , ThumbnailFailedPayload} from '@/types/thumbnails'
const styles = [
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

export default function ThumbnailBuilder({
  onJobStarted,
  onJobCreated,
  onFailedOrSucess,
  isGenerating,
}: ThumbnailBuilderProps) {
  
  const queryClient = useQueryClient() //* for adding thumbnails data to the ten stack query cache

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stylePickerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [prompt, setPrompt] = useState("");

  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<StyleId[]>([]);


  // TanStack Query mutation hooks
  const { mutateAsync: uploadHeadshotAsync } = useUploadHeadshot();
  const { mutateAsync: createJobAsync } = useCreateJob();

  useEffect(() => {
    function closeStyleMenu(event: MouseEvent) {
      if (
        stylePickerRef.current &&
        !stylePickerRef.current.contains(event.target as Node)
      ) {
        setIsStyleMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeStyleMenu);
    return () => document.removeEventListener("mousedown", closeStyleMenu);
  }, []);

  useEffect(() => {
    if (isGenerating) setIsStyleMenuOpen(false);
  }, [isGenerating]);

  function setSelectedFile(nextFile: File) {
    if (!nextFile.type.startsWith("image/")) return;

    setFile(nextFile);
    setShowValidation(false);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(nextFile);
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (isGenerating) return;
    const nextFile = event.target.files?.[0];
    if (nextFile) setSelectedFile(nextFile);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (isGenerating) return;
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (isGenerating) return;
    event.preventDefault();
    setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (isGenerating) return;
    event.preventDefault();
    setIsDraggingFile(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) setSelectedFile(droppedFile);
  }

  function removeFile(event: ReactMouseEvent<HTMLButtonElement>) {
    if (isGenerating) return;
    event.stopPropagation();
    setFile(null);
    setShowValidation(false);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return "";
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }


  // sets the styles selected by user into the hook
  function toggleStyle(styleId: StyleId) {
    if (isGenerating) return;
    setShowValidation(false);
    setSelectedStyles((current : StyleId[]) => {
      if (current.includes(styleId))
        return current.filter((id : string) => id !== styleId);
      if (current.length >= 3) return current;
      return [...current, styleId];
    });
  }

  function removeStyle(styleId: StyleId) {
    if (isGenerating) return;
    setShowValidation(false);
    setSelectedStyles((current : StyleId[]) => current.filter((id : string) => id !== styleId));
  }



  async function handleGenerate() {
    if (!file || !prompt.trim() || selectedStyles.length === 0) {
      setShowValidation(true);
      return;
    }

    onJobStarted(selectedStyles);

    try {
      // 1. Upload headshot using TanStack Query mutation
      const uploadResult = await uploadHeadshotAsync(file);

      // 2. Create job using TanStack Query mutation
      const jobResult = await createJobAsync({
        user_prompt: prompt,
        headshot_url: uploadResult.headshot_url,
        styles: selectedStyles,
        num_of_thumbnails: selectedStyles.length,
      });
      
      sessionStorage.setItem("jobId", jobResult.job_id);
      onJobCreated(jobResult.job_id);
     

      // 3. Subscribe to real-time status updates via SSE
      subscribeToJobStatus(jobResult.job_id, {

        //* when ever SSE API fucntion call any of these function we add its data into cache

        onThumbnailReady : (data : ThumbnailReadyPayload) => {
           queryClient.setQueryData( // change cache data trigger due to which where this data is being used react re-renders that comp
            ['thumbnails' , jobResult.job_id],
            (old:any) =>({
              ...old,
              thumbnails: [                                                                                                    
          ...(old?.thumbnails || []).filter((t: any) => t.id !== data.id),                                               
            data   // ← { id, style_name, status: "completed", imageKit_url, variants }                                    
            ]                            
            })
           )
        },

        onThumbnailFailed:  (data :  ThumbnailFailedPayload) => {
           queryClient.setQueryData(
            ['thumbnails' , jobResult.job_id],
            (old:any) =>({
              ...old,
               thumbnails: [                                                                                                    
           ...(old?.thumbnails || []).filter((t: any) => t.id !== data.id),                                               
             data   // ← { id, style_name, status: "failed", error_message }                                                
            ]     
            })
           )
        },

        onJobComplete: () => onFailedOrSucess(),
        
        onFailed : (error) =>{
           onFailedOrSucess(error.error) // set is generating to false             
           queryClient.setQueryData(
            ['thumbnails' , jobResult.job_id],
            (old :any) =>({
              ...old,
              error:error
            })
           )
        },

        onError : () => onFailedOrSucess()
      });
    } catch (err: unknown) {
      onFailedOrSucess(err instanceof Error ? err.message : "Generation failed");
    }
  }




  return (
    <section className="builder-panel" aria-label="Thumbnail builder">
      <div className="builder-grid">
        {/* Upload Column */}
        <div className="upload-column">
          <label className="font-mono field-label" htmlFor="headshot">
            Headshot Photo <b>*</b>
          </label>

          <div
            className={`upload-zone ${previewUrl ? "has-preview" : ""} ${
              isDraggingFile ? "dragging" : ""
            } ${showValidation && !file ? "input-invalid" : ""} ${
              isGenerating ? "is-disabled" : ""
            }`}
            aria-disabled={isGenerating}
            onClick={() => {
              if (!isGenerating) fileInputRef.current?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Selected headshot preview" />
            ) : (
              <span className="upload-placeholder">
                <span className="plus-icon">+</span>
                <span className="font-mono">Click to upload</span>
                <small className="font-mono">PNG, JPG up to 2MB</small>
              </span>
            )}
            {previewUrl && (
              <>
                <span className="change-photo font-mono">Change photo</span>{" "}
                <span className="remove-photo-wrap">
                  <button
                    className="remove-photo"
                    type="button"
                    disabled={isGenerating}
                    onClick={removeFile}
                    aria-label="Remove selected image"
                  >
                    ×
                  </button>
                </span>{" "}
              </>
            )}
          </div>



          <input
            ref={fileInputRef}
            id="headshot"
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            disabled={isGenerating}
            onChange={handleFileChange}
          />
          {file && <p className="file-name">{file.name}</p>}
        </div>

        {/* Details Column */}
        <div className="details-column">
          <label className="field-label font-mono" htmlFor="prompt">
            Describe your thumbnail <b>*</b>
          </label>
          <textarea
            id="prompt"
            style={{ fontFamily: 'monospace' }}
            className={`font-mono placeholder:font-mono ${
              showValidation && !prompt.trim() ? "input-invalid" : ""
            }`}
            value={prompt}
            disabled={isGenerating}
            onChange={(event) => {
              setPrompt(event.target.value);
              if (event.target.value.trim()) setShowValidation(false);
            }}
            placeholder="e.g. A tech review thumbnail with text 'iPhone 17 Review' in bold letters, futuristic background..."
            rows={4}
          />
          <div className="styles-heading">
            <span className="field-label pb-1 font-mono">Choose your styles</span>
            <span className="selection-count font-mono">
              {selectedStyles.length}/3 selected
            </span>
          </div>

          <div ref={stylePickerRef} className="style-picker">
            <button
              className={`style-picker-trigger ${
                isStyleMenuOpen ? "open" : ""
              } ${showValidation && selectedStyles.length === 0 ? "input-invalid" : ""}`}
              type="button"
              disabled={isGenerating}
              onClick={() => setIsStyleMenuOpen((open) => !open)}
              aria-expanded={isStyleMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="font-mono">
                {selectedStyles.length
                  ? "Add another style"
                  : "Select a visual direction"}
              </span>
              <span className="chevron">⌄</span>
            </button>
            {isStyleMenuOpen && (
              <div
                className="style-menu font-mono"
                role="listbox"
                aria-label="Available thumbnail styles"
              >
                {styles.map(([id, label, accent]) => {
                  const selected = selectedStyles.includes(id as StyleId);
                  const disabled = !selected && selectedStyles.length >= 3;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled || isGenerating}
                      key={id}
                      className={`style-option  ${selected ? "selected" : ""}`}
                      onClick={() => toggleStyle(id as StyleId)}
                    >
                      <span
                        className="style-dot "
                        style={{ backgroundColor: accent }}
                      />
                      <span>{label}</span>
                      {selected && <span className="check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={`selected-styles font-mono ${
              selectedStyles.length > 0 ? "has-selections" : ""
            }`}
            aria-label="Selected styles"
          >
            {selectedStyles.map((selectedId) => {
              const style = styles.find(([id]) => id === selectedId);
              if (!style) return null;
              return (
                <div className="selected-style" key={style[0]}>
                  <span
                    className="style-dot "
                    style={{ backgroundColor: style[2] }}
                  />
                  <span>{style[1]}</span>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => removeStyle(style[0] as StyleId)}
                    aria-label={`Remove ${style[1]}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <p className="style-hint pt-2 font-mono">
            Choose up to 3 styles. Each adds a different creative direction.
          </p>
          {showValidation && (!file || !prompt.trim() || selectedStyles.length === 0) && (
            <p className="validation-message font-mono" role="alert">
              Add a headshot, description, and at least one style to continue.
            </p>
          )}
        </div>
      </div>

      {isGenerating && (
        <p className="builder-lock-message font-mono" role="status">
          Your thumbnails are generating. Editing is temporarily unavailable.
        </p>
      )}

      {/* Generate Button */}
      <button
        className="generate-button"
        type="button"
        aria-disabled={!file || !prompt.trim() || selectedStyles.length === 0 || isGenerating}
        disabled={isGenerating}
        onClick={handleGenerate}
      >
        <span className="sparkle " aria-hidden="true">
          ✦
        </span>

  <span className="font-mono">
  {isGenerating
          ? "Preparing your thumbnails..."
          : "Generate Thumbnails"}
    </span>
        

        {isGenerating ? (
          <LoaderCircle className="button-loader" aria-hidden="true" />
        ) : (
          <ArrowRight className="button-arrow" aria-hidden="true" />
        )}
      </button>
    </section>
  );
}
