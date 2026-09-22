"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FileIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getAcceptAttribute,
  getMaxUploadSize,
  validateUpload,
  type FileItemType,
} from "@/lib/file-upload";
import { formatFileSize } from "@/lib/item-detail";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/types/items";

const UPLOAD_ERROR = "Couldn't upload this file. Please try again.";
const FIELD_ID = "field-file";
const ERROR_ID = `${FIELD_ID}-error`;

interface PresignData {
  uploadUrl: string;
  contentType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface PresignResponse {
  success: boolean;
  error?: string;
  data?: PresignData;
}

// The PUT goes over XMLHttpRequest rather than fetch, which reports no upload
// progress. Returns the abort handle so a replaced or cancelled upload stops.
function putToR2(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): { done: Promise<void>; abort: () => void } {
  const xhr = new XMLHttpRequest();

  const done = new Promise<void>((resolve, reject) => {
    xhr.open("PUT", url);
    // Must match the type the URL was signed with, or R2 rejects the signature.
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 rejected the upload (${xhr.status})`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new DOMException("Upload aborted", "AbortError")));

    xhr.send(file);
  });

  return { done, abort: () => xhr.abort() };
}

interface FileUploadProps {
  typeName: FileItemType;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  // Set once the form has been submitted with no file.
  error?: string;
  onUploadingChange: (uploading: boolean) => void;
}

// Drag-and-drop upload for file and image items: validates, asks the server for
// a presigned URL, then PUTs straight to R2 with a progress bar.
export function FileUpload({
  typeName,
  value,
  onChange,
  error,
  onUploadingChange,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<{ abort: () => void } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // An object URL of the local file, so an image previews instantly instead of
  // waiting on a round trip to R2.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploading = progress !== null;
  const message = uploadError ?? error;

  useEffect(() => {
    return () => {
      uploadRef.current?.abort();
    };
  }, []);

  // Revoking is tied to the URL itself, so a replaced file can't leak the old one.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function setUploading(percent: number | null) {
    setProgress(percent);
    onUploadingChange(percent !== null);
  }

  async function handleFile(file: File) {
    uploadRef.current?.abort();
    setUploadError(null);

    const validation = validateUpload({
      typeName,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    });
    if (!validation.ok) {
      setUploadError(validation.error);
      return;
    }

    onChange(null);
    setPreviewUrl(typeName === "image" ? URL.createObjectURL(file) : null);
    setUploading(0);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeName,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
        }),
      });
      const result: PresignResponse = await response.json();
      if (!response.ok || !result.success || !result.data) {
        setUploadError(result.error ?? UPLOAD_ERROR);
        setUploading(null);
        return;
      }

      const { uploadUrl, contentType, fileUrl, fileName, fileSize } = result.data;
      const upload = putToR2(uploadUrl, file, contentType, setUploading);
      uploadRef.current = upload;
      await upload.done;

      onChange({ fileUrl, fileName, fileSize });
      setUploading(null);
    } catch (uploadFailure) {
      // A replaced or unmounted upload isn't a failure worth reporting.
      if (uploadFailure instanceof DOMException && uploadFailure.name === "AbortError") {
        return;
      }
      console.error("Upload failed", uploadFailure);
      setUploadError(UPLOAD_ERROR);
      setUploading(null);
    } finally {
      uploadRef.current = null;
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change event.
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleRemove() {
    uploadRef.current?.abort();
    setUploading(null);
    setUploadError(null);
    setPreviewUrl(null);
    onChange(null);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={FIELD_ID}>{typeName === "image" ? "Image" : "File"}</Label>

      <input
        ref={inputRef}
        id={FIELD_ID}
        type="file"
        className="sr-only"
        accept={getAcceptAttribute(typeName)}
        onChange={handleInputChange}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? ERROR_ID : undefined}
      />

      <div
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border border-dashed p-4 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40",
          message && "border-destructive"
        )}
      >
        {value || uploading ? (
          <div className="flex items-center gap-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a remote image next/image can optimize
              <img
                src={previewUrl}
                alt=""
                className="size-12 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background">
                <FileIcon className="size-5 text-muted-foreground" />
              </span>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium">{value?.fileName ?? "Uploading…"}</p>
              {uploading ? (
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                value && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
                )
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              aria-label={uploading ? "Cancel upload" : "Remove file"}
            >
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 rounded-md py-4 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium text-primary">Choose a file</span> or drag it here
            </span>
            <span className="text-xs text-muted-foreground">
              Up to {formatFileSize(getMaxUploadSize(typeName))}
            </span>
          </button>
        )}
      </div>

      {message && (
        <p id={ERROR_ID} className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
