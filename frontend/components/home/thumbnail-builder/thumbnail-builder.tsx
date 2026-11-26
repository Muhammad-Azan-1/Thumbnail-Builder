"use client";
import styles from "./thumbnail-builder.module.css";
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
import type { StyleId, ThumbnailBuilderProps } from "@/types/props";
import { ThumbnailResponse } from "@/types/thumbnails";
import { startThumbnailJobStream } from "@/lib/thumbnail-job-stream";
import { CooldownTimerState } from "@/types/rateLimit";
import { RateLimitError } from "@/lib/rateLimit";
import CooldownTimer from "@/components/ui/use-cooldown-timer";
import { styleOptions ,RATE_LIMIT_ACTIONS} from '@/constants'


export default function ThumbnailBuilder({
  onJobStarted,
  onJobCreated,
  onFailedOrSucess,
  isGenerating,
  data,
}: ThumbnailBuilderProps) {
  const queryClient = useQueryClient(); //* used for adding thumbnails data to the ten stack query cache

  //* TanStack Query mutation hooks
  const { mutateAsync: uploadHeadshotAsync  } = useUploadHeadshot();
  const { mutateAsync: createJobAsync } = useCreateJob();

  //* cooldown timer and rate limiter setup
  const [cooldown, setCooldown] = useState<CooldownTimerState>({ isActive: false });

  
  //* local states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stylePickerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [existingHeadshotUrl, setExistingHeadshotUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [prompt, setPrompt] = useState("");

  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<StyleId[]>([]);

  
  const [rateLimitError , setRateLimitError] = useState<RateLimitError | null>(null)
  const isRateLimited = rateLimitError instanceof RateLimitError;
  //* on full page refresh or when ever the jobData changes

  useEffect(() => {
    if(data){
    setSelectedStyles(
      data.thumbnails
        .map((thumbnail: ThumbnailResponse) => thumbnail.style_name)
        .filter((style): style is StyleId => Boolean(style)),
    );
    setPrompt(data.user_prompt ?? "");
    setExistingHeadshotUrl(data.headshot_url ?? "");
    setPreviewUrl(data.headshot_url ?? "");
  }
  }, [data]);



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
    setExistingHeadshotUrl("");
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
    setSelectedStyles((current: StyleId[]) => {
      if (current.includes(styleId))
        return current.filter((id: string) => id !== styleId);
      if (current.length >= 3) return current;
      return [...current, styleId];
    });
  }

  function removeStyle(styleId: StyleId) {
    if (isGenerating) return;
    setShowValidation(false);
    setSelectedStyles((current: StyleId[]) =>
      current.filter((id: string) => id !== styleId),
    );
  }

  //* main function which starts the image generation
  async function handleGenerate() :  Promise<void>  {
    if ((!file && !existingHeadshotUrl) || !prompt.trim() || selectedStyles.length === 0) {
      setShowValidation(true);
      return;
    }
    setRateLimitError(null)
    onJobStarted(selectedStyles);
    try {
      // Reuse the saved headshot after refresh unless the user picked a new file.
      const headshotUrl = file
        ? (await uploadHeadshotAsync(file)).headshot_url
        : existingHeadshotUrl;

      // Create the job with the selected or previously saved headshot.
      const jobResult = await createJobAsync({
        user_prompt: prompt,
        headshot_url: headshotUrl,
        styles: selectedStyles,
        num_of_thumbnails: selectedStyles.length,
      });

      const createdJobId = jobResult.id;
      queryClient.setQueryData(["thumbnails", createdJobId], jobResult);
      sessionStorage.setItem("jobId", createdJobId);
      onJobCreated(createdJobId);
      setFile(null);

      //*files setup
      setExistingHeadshotUrl(jobResult.headshot_url);
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(jobResult.headshot_url);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // 3. Subscribe to real-time status updates via SSE
      startThumbnailJobStream(
        {
        jobId: createdJobId,
        queryClient,
        
        onComplete : (data) => {
          if (data.status === "failed") {
            onFailedOrSucess(data.job_error || '');
          } else {
            onFailedOrSucess();
          }
        },

        onFailed: (error) => {
          onFailedOrSucess(error.error);
        },

        onError: (error) => {
          onFailedOrSucess(error.error);
        },
      }

    );


    } catch (err: unknown) {
      if(err instanceof RateLimitError){
       queryClient.invalidateQueries({queryKey : ['cooldown']})
        setRateLimitError(err)
      }
      onFailedOrSucess(
        err instanceof Error ? err.message : "Generation failed",
      );
    }

  }

  return (
    <section className={styles.builderPanel} aria-label="Thumbnail builder">
      <div className={styles.builderGrid}>
        {/* Upload Column */}
        <div className={styles.uploadColumn}>
          <label className="font-mono field-label" htmlFor="headshot">
            Headshot Photo <b>*</b>
          </label>

          <div
            className={`${styles.uploadZone} ${
              isDraggingFile ? styles.dragging : ""
            } ${showValidation && !file && !existingHeadshotUrl ? "input-invalid" : ""} ${
              isGenerating ? styles.isDisabled : ""
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
              <span className={styles.uploadPlaceholder}>
                <span className={styles.plusIcon}>+</span>
                <span className="font-mono">Click to upload</span>
                <small className="font-mono">PNG, JPG up to 2MB</small>
              </span>
            )}
            {previewUrl && (
              <>
                <span className={`${styles.changePhoto} font-mono`}>Change photo</span>{" "}
                <span className={styles.removePhotoWrap}>
                  <button
                    className={styles.removePhoto}
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
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            disabled={isGenerating}
            onChange={handleFileChange}
          />
        </div>

        {/* Details Column */}
        <div className={styles.detailsColumn}>
          <label className="field-label font-mono" htmlFor="prompt">
            Describe your thumbnail <b>*</b>
          </label>
          <textarea
            id="prompt"
            style={{ fontFamily: "monospace" }}
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
          <div className={styles.stylesHeading}>
            <span className="field-label pb-1 font-mono">
              Choose your styles
            </span>
            <span className={`${styles.selectionCount} font-mono`}>
              {selectedStyles.length}/3 selected
            </span>
          </div>

          <div ref={stylePickerRef} className={styles.stylePicker}>
            <button
              className={`${styles.stylePickerTrigger} ${
                isStyleMenuOpen ? styles.open : ""
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
              <span className={styles.chevron}>⌄</span>
            </button>
            {isStyleMenuOpen && (
              <div
                className={`${styles.styleMenu} font-mono`}
                role="listbox"
                aria-label="Available thumbnail styles"
              >
                {styleOptions.map(([id, label, accent]) => {
                  const selected = selectedStyles.includes(id as StyleId);
                  const disabled = !selected && selectedStyles.length >= 3;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled || isGenerating}
                      key={id}
                      className={`${styles.styleOption} ${selected ? styles.selected : ""}`}
                      onClick={() => toggleStyle(id as StyleId)}
                    >
                      <span
                        className={styles.styleDot}
                        style={{ backgroundColor: accent }}
                      />
                      <span>{label}</span>
                      {selected && <span className={styles.check}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={`${styles.selectedStyles} font-mono ${
              selectedStyles.length > 0 ? styles.hasSelections : ""
            }`}
            aria-label="Selected styles"
          >
            {selectedStyles.map((selectedId) => {
              const style = styleOptions.find(([id]) => id === selectedId);
              if (!style) return null;
              return (
                <div className={styles.selectedStyle} key={style[0]}>
                  <span
                    className={styles.styleDot}
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
          <p className={`${styles.styleHint} pt-2 font-mono`}>
            Choose up to 3 styles. Each adds a different creative direction.
          </p>
          {showValidation &&
            ((!file && !existingHeadshotUrl) || !prompt.trim() || selectedStyles.length === 0) && (
              <p className={`${styles.validationMessage} font-mono`} role="alert">
                Add a headshot, description, and at least one style to continue.
              </p>
            )}
        </div>
      </div>

      {isGenerating && (
        <p className={`${styles.builderLockMessage} font-mono`} role="status">
          Your thumbnails are generating. Editing is temporarily unavailable.
        </p>
      )}

      {/* Generate Button */}
      <button
        className={styles.generateButton}
        type="button"
        aria-disabled={
          (!file && !existingHeadshotUrl) || !prompt.trim() || selectedStyles.length === 0 || isGenerating
        }
        disabled={isGenerating || cooldown.isActive}
        onClick={handleGenerate}
      >
        {/* || isRateLimited */}
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

      <CooldownTimer
      action={[
        RATE_LIMIT_ACTIONS.thumbnails.uploadHeadshot,
        RATE_LIMIT_ACTIONS.thumbnails.createJob,
      ]}
      isRateLimited={isRateLimited}
      retryAfterExpiresAt={rateLimitError?.retryAfterExpiresAt}
      onCooldownChange={setCooldown}
      />
      
    </section>
  );
}
