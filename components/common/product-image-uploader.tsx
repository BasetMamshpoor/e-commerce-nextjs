"use client";

import * as React from "react";
import { Upload, X, Star, ImagePlus, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaGalleryPicker } from "@/components/common/media-gallery-picker";

export interface ProductImageItem {
  /** Existing ProductImage ID from backend (for deletion). Undefined for new images. */
  id?: number;
  /** Media URL (existing, gallery-picked, or object URL for new uploads). */
  url: string;
  /** Is this the main image? */
  isMain: boolean;
  /** Display order. */
  order: number;
  /** File reference — only set for newly uploaded images (NOT for gallery-picked). */
  file?: File;
  /** Media ID — only set for gallery-picked images (NOT for newly uploaded).
   *  When set, the parent sends this in the JSON `images` array. */
  mediaId?: number;
}

interface ProductImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  /** IDs of existing ProductImages marked for deletion. */
  deletedImageIds: number[];
  onDeletedIdsChange: (ids: number[]) => void;
}

/**
 * Image uploader for admin product form.
 *
 * Supports THREE sources for each image:
 *   1. Existing image (loaded from backend) — has `id` and `url`.
 *   2. New file uploaded from disk — has `file` and `url` (object URL).
 *   3. Existing Media selected from gallery — has `mediaId` and `url`.
 *
 * On submit, the parent separates these:
 *   - Files → multipart field `images` (uploaded + attached by backend)
 *   - mediaIds → JSON field `images: [{mediaId, order, isMain}]`
 *   - Existing IDs marked for deletion → JSON field `deletedImages: [ids]`
 *
 * The backend supports BOTH files and mediaIds in the same request.
 */
export function ProductImageUploader({
  images,
  onChange,
  deletedImageIds,
  onDeletedIdsChange,
}: ProductImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [galleryOpen, setGalleryOpen] = React.useState(false);

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

  const onGallerySelect = (picked: Array<{ id: number; url: string }>) => {
    if (picked.length === 0) return;
    const hadNoMain = images.length === 0 || !images.some((i) => i.isMain);
    const newImages: ProductImageItem[] = picked.map((m, i) => ({
      url: m.url,
      isMain: hadNoMain && i === 0,
      order: images.length + i,
      mediaId: m.id,
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
    // If it's an existing image (has id), add to deleted list.
    if (img.id) {
      onDeletedIdsChange([...deletedImageIds, img.id]);
    }
    // If it was the main image, make the first remaining image main.
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
    newImages.forEach((img, i) => (img.order = i));
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => onFilesSelected(e.target.files)}
          className="hidden"
        />
        {/* Drop zone (clickable for upload) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-accent/30",
          )}
        >
          <ImagePlus className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            آپلود از حافظه
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            بکشید و رها کنید یا کلیک کنید — چند فایل همزمان
          </p>
        </div>
        {/* Gallery button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setGalleryOpen(true)}
          className="flex-col gap-1 px-6 py-4"
        >
          <FolderOpen className="size-7 text-primary" />
          <span className="text-sm font-medium">انتخاب از گالری</span>
          <span className="text-[11px] text-muted-foreground">می‌توانید چند مورد انتخاب کنید</span>
        </Button>
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
                (window as unknown as { __dragIndex?: number }).__dragIndex = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = (window as unknown as { __dragIndex?: number }).__dragIndex;
                if (typeof from === "number") moveImage(from, index);
              }}
            >
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
              {/* Source badge */}
              {img.mediaId && (
                <div className="absolute left-1 top-1 rounded-md bg-primary/80 px-1 py-0.5 text-[9px] text-primary-foreground">
                  گالری
                </div>
              )}
              {img.file && (
                <div className="absolute left-1 top-1 rounded-md bg-success/80 px-1 py-0.5 text-[9px] text-white">
                  جدید
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
              <div className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white nums-fa">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaGalleryPicker
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={onGallerySelect}
        multiple
        allowedType="IMAGE"
        title="انتخاب تصاویر محصول از گالری"
      />
    </div>
  );
}
