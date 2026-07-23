"use client";

import * as React from "react";
import { ImagePlus, X, Loader2, FolderOpen, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaGalleryPicker } from "@/components/common/media-gallery-picker";
import type { MediaType } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Unified single-image field for entity forms.
 *
 * Lets the user pick an image EITHER by:
 *   1. Uploading a new file from disk (sent via multipart on form submit)
 *   2. Selecting an existing Media from the gallery (sent via JSON mediaId)
 *
 * The parent form decides how to consume the value via `onChange`:
 *   - `{ kind: "file", file: File }` — caller sends multipart with the file
 *   - `{ kind: "mediaId", mediaId: number }` — caller sends JSON with the mediaId
 *   - `{ kind: "removed" }` — caller sends mediaId: null in JSON (clear existing)
 *   - `{ kind: "unchanged" }` — caller skips this field entirely
 *
 * The `previewUrl` is always populated for display.
 */

export type EntityImageValue =
  | { kind: "unchanged"; previewUrl: string | null }
  | { kind: "file"; file: File; previewUrl: string }
  | { kind: "mediaId"; mediaId: number; previewUrl: string }
  | { kind: "removed"; previewUrl: null };

export interface EntityImageFieldProps {
  /** Current label for the field, e.g. "لوگو برند" or "تصویر کاور". */
  label?: string;
  /** Existing preview URL (from backend) when editing. */
  initialUrl?: string | null;
  /** Hint text shown under the buttons. */
  hint?: string;
  /** Allowed media type for gallery picker. Defaults to "image". */
  allowedType?: MediaType | "all";
  /** Whether this field is required (blocks form submit if empty). */
  required?: boolean;
  /** Render a square (1:1) preview instead of the default 4:3. */
  square?: boolean;
  /** Called whenever the value changes. */
  onChange: (value: EntityImageValue) => void;
  /** True when the parent form is submitting (disables buttons). */
  disabled?: boolean;
}

export function EntityImageField({
  label,
  initialUrl,
  hint = "فرمت: JPG, PNG, WebP — حداکثر ۲ مگابایت",
  allowedType = "IMAGE",
  required = false,
  square = false,
  onChange,
  disabled = false,
}: EntityImageFieldProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialUrl ?? null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset preview when initialUrl changes (e.g. when the dialog re-opens for a different entity).
  React.useEffect(() => {
    setPreviewUrl(initialUrl ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Reset value to "unchanged" — parent should track this via onChange.
    // Use a ref to avoid infinite loops; only fire when initialUrl actually changes.
    onChange({ kind: "unchanged", previewUrl: initialUrl ?? null });
     
  }, [initialUrl]);

  const onFileSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      // For document types we don't preview, but still allow.
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange({ kind: "file", file, previewUrl: url });
  };

  const onGallerySelect = (items: Array<{ id: number; url: string }>) => {
    if (items.length === 0) return;
    const picked = items[0];
    setPreviewUrl(picked.url);
    onChange({ kind: "mediaId", mediaId: picked.id, previewUrl: picked.url });
  };

  const removeImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({ kind: "removed", previewUrl: null });
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label required={required}>{label}</Label>
      )}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted",
            square ? "size-20" : "size-20",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="size-full object-contain"
            />
          ) : (
            <ImagePlus className="size-7 text-muted-foreground" />
          )}
          {disabled && previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={
              allowedType === "VIDEO"
                ? "video/*"
                : allowedType === "all"
                ? "image/*,video/*"
                : "image/*"
            }
            onChange={(e) => onFileSelected(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Upload className="size-4" />
              آپلود از حافظه
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              disabled={disabled}
            >
              <FolderOpen className="size-4" />
              انتخاب از گالری
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeImage}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <X className="size-4" />
                حذف
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>

      <MediaGalleryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onGallerySelect}
        multiple={false}
        allowedType={allowedType}
        title={label ? `انتخاب ${label}` : "انتخاب از گالری"}
      />
    </div>
  );
}

/* ───────── Small Label helper (avoids extra import when only needed here) ───────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
      {required && <span className="mr-1 text-destructive">*</span>}
    </p>
  );
}
