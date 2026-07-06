"use client";

import * as React from "react";
import { Upload, X, Star, Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductImageItem {
  /** Existing image ID from backend (for deletion). Undefined for new uploads. */
  id?: number;
  /** Media URL (existing) or object URL (new upload). */
  url: string;
  /** Is this the main image? */
  isMain: boolean;
  /** Display order. */
  order: number;
  /** File reference (only for new uploads). */
  file?: File;
}

interface ProductImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  /** IDs of images marked for deletion (existing images removed from the list). */
  deletedImageIds: number[];
  onDeletedIdsChange: (ids: number[]) => void;
}

/**
 * Image uploader for admin product form.
 *
 * Supports:
 *   - Drag-and-drop or click to upload new images
 *   - Marking one image as main (isMain)
 *   - Reordering via drag (TODO) — for now, ordering by upload order
 *   - Removing existing images (adds to deletedImageIds)
 *   - Removing new uploads (just removes from list)
 *
 * New images are uploaded to /media by the parent on submit, then their
 * mediaId is passed to the product create/update endpoint.
 */
export function ProductImageUploader({
  images,
  onChange,
  deletedImageIds,
  onDeletedIdsChange,
}: ProductImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: ProductImageItem[] = Array.from(files).map((file, i) => ({
      url: URL.createObjectURL(file),
      isMain: images.length === 0 && i === 0,
      order: images.length + i,
      file,
    }));
    onChange([...images, ...newImages]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFilesSelected(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const img = images[index];
    // If it's an existing image (has id), add to deleted list
    if (img.id) {
      onDeletedIdsChange([...deletedImageIds, img.id]);
    }
    // If it was the main image, make the first remaining image main
    const remaining = images.filter((_, i) => i !== index);
    if (img.isMain && remaining.length > 0 && !remaining.some((r) => r.isMain)) {
      remaining[0].isMain = true;
    }
    onChange(remaining);
  };

  const setMain = (index: number) => {
    onChange(images.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    // Reassign order
    newImages.forEach((img, i) => (img.order = i));
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/30",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => onFilesSelected(e.target.files)}
          className="hidden"
        />
        <ImagePlus className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          تصاویر را اینجا بکشید یا کلیک کنید
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          فرمت: JPG, PNG, WebP — چند فایل همزمان
        </p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                img.isMain ? "border-primary" : "border-border",
              )}
              draggable
              onDragStart={() => {
                // Store index for drag-and-drop reorder
                (window as unknown as { __dragIndex?: number }).__dragIndex = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = (window as unknown as { __dragIndex?: number }).__dragIndex;
                if (typeof from === "number") moveImage(from, index);
              }}
            >
              { }
              <img
                src={img.url}
                alt={`تصویر ${index + 1}`}
                className="size-full object-cover"
              />
              {/* Main badge */}
              {img.isMain && (
                <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="size-2.5 fill-current" />
                  اصلی
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isMain && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMain(index);
                    }}
                  >
                    <Star className="size-3" />
                    اصلی
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
              {/* Order number */}
              <div className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white nums-fa">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
