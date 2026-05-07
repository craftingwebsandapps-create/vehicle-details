import { useRef } from "react"

import {
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  ImageIcon,
  RotateCcw,
  Trash2,
  UploadCloud,
} from "lucide-react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"

import { Button } from "~/components/ui/button"

export type FileUploadFieldProps<T extends FieldValues> = {
  /** RHF form instance */
  form: UseFormReturn<T>
  /** Field path in the form values */
  name: Path<T>
  /** Field label shown above the upload zone */
  label?: string
  /** Show required asterisk and validate presence */
  required?: boolean
  /** Headline inside the empty-state drop zone */
  uploadTitle?: string
  /** Subtitle inside the empty-state drop zone */
  uploadSubtitle?: string
  /** Footer hint inside the empty-state drop zone */
  uploadHint?: string
  /** Alt text for image preview */
  previewAlt?: string
  /** Fallback filename shown in the success state when value is a URL */
  existingFileName?: string
  /** Whether to show the "Take Photo" (camera) button. Default true. */
  showCamera?: boolean
  /** Whether to show the "Choose from Gallery" button. Default true. */
  showGallery?: boolean
  /** Whether to show the "Upload PDF" button. Default true. */
  showPdf?: boolean
}

/** @deprecated Use FileUploadField directly */
export type Props<T extends FieldValues> = FileUploadFieldProps<T>

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExt(type: string): string {
  return type.split("/")[1]?.toUpperCase() ?? "FILE"
}

export function FileUploadField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  uploadTitle = "Upload file",
  uploadSubtitle = "JPG, PNG or PDF • Max size 5MB",
  uploadHint = "Supported formats: JPG, PNG, PDF. Max size: 5MB",
  previewAlt = "File preview",
  existingFileName = "Existing file",
  showCamera = true,
  showGallery = true,
  showPdf = true,
}: FileUploadFieldProps<T>) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as unknown
        const file = value instanceof File ? value : null
        const existingUrl = typeof value === "string" && value ? value : null
        const hasValue = file !== null || existingUrl !== null

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const selected = event.target.files?.[0] ?? null
          field.onChange(selected)
          event.target.value = ""
        }

        const handleRemove = () => {
          field.onChange(null)
        }

        const isImage =
          file?.type.startsWith("image/") ??
          /\.(jpg|jpeg|png|gif|webp)$/i.test(existingUrl ?? "")

        const previewUrl = file
          ? URL.createObjectURL(file)
          : (existingUrl ?? undefined)

        return (
          <div className="space-y-1.5">
            {label ? (
              <p className="text-sm leading-none font-medium text-foreground">
                {label}
                {required ? (
                  <span className="ml-0.5 text-destructive">*</span>
                ) : null}
              </p>
            ) : null}

            {/* Hidden file inputs */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleChange}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handleChange}
            />
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleChange}
            />

            {!hasValue ? (
              /* ── Empty state ── */
              <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-6 text-center">
                <UploadCloud className="mx-auto size-10 text-primary" />
                <p className="mt-2 text-sm font-semibold text-primary">
                  {uploadTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {uploadSubtitle}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {showCamera ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cameraRef.current?.click()}
                    >
                      <Camera className="size-3.5" />
                      Take Photo
                    </Button>
                  ) : null}
                  {showGallery ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => galleryRef.current?.click()}
                    >
                      <ImageIcon className="size-3.5" />
                      Choose from Gallery
                    </Button>
                  ) : null}
                  {showPdf ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => pdfRef.current?.click()}
                    >
                      <FileText className="size-3.5" />
                      Upload PDF
                    </Button>
                  ) : null}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {uploadHint}
                </p>
              </div>
            ) : (
              /* ── Success / file present state ── */
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <div className="flex items-center gap-3">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={previewAlt}
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-7 text-muted-foreground" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file?.name ?? existingFileName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {file
                        ? `${formatFileSize(file.size)} • ${getFileExt(file.type)}`
                        : existingFileName}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle2 className="size-3.5" />
                      {file ? "Ready to upload" : "Uploaded successfully"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    onClick={handleRemove}
                    aria-label="Remove file"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {previewUrl ? (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={previewUrl} target="_blank" rel="noreferrer">
                        <Eye className="size-3.5" />
                        Preview
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => galleryRef.current?.click()}
                  >
                    <RotateCcw className="size-3.5" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {fieldState.error ? (
              <p className="text-sm font-medium text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )
      }}
    />
  )
}

/**
 * Backward-compatible alias. Prefer FileUploadField for new usages.
 */
export const LicenceUploadField = FileUploadField
