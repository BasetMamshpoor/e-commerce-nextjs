"use client";

import * as React from "react";
import { Search, Loader2, Image as ImageIcon, Check, FileText, Film } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { mediaService } from "@/services";
import type { Media, MediaType } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

export interface MediaGalleryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms selection. Returns the chosen Media objects. */
  onSelect: (items: Media[]) => void;
  /** Allow selecting multiple items (default: false). */
  multiple?: boolean;
  /** Restrict to a specific media type. Default: image only. */
  allowedType?: MediaType | "all";
  /** Title of the dialog. */
  title?: string;
}

const PAGE_SIZE = 24;

export function MediaGalleryPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  allowedType = "IMAGE",
  title = "انتخاب از گالری رسانه‌ها",
}: MediaGalleryPickerProps) {
  const [items, setItems] = React.useState<Media[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Media[]>([]);

  // Debounce search input.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset selection when dialog opens.
  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
      setPage(1);
    }
  }, [open]);

  // Fetch media list.
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (allowedType !== "all") params.type = allowedType;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    mediaService
      .list(params)
      .then((data) => {
        setItems(data.items);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [open, page, debouncedSearch, allowedType]);

  const toggleSelect = (m: Media) => {
    if (multiple) {
      setSelected((prev) =>
        prev.some((s) => s.id === m.id)
          ? prev.filter((s) => s.id !== m.id)
          : [...prev, m],
      );
    } else {
      setSelected([m]);
    }
  };

  const onConfirm = () => {
    if (selected.length === 0) return;
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {multiple
              ? "می‌توانید چند مورد را انتخاب کنید."
              : "یک مورد را انتخاب کنید."}
            {total > 0 && (
              <span className="mr-2 text-muted-foreground nums-fa">
                ({toPersianDigits(total)} فایل)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجو در رسانه‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Grid */}
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-3 size-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {debouncedSearch.trim()
                  ? "نتیجه‌ای یافت نشد."
                  : "هیچ رسانه‌ای موجود نیست."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {items.map((m) => {
                const isSelected = selected.some((s) => s.id === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelect(m)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                    title={m.originalName}
                  >
                    {m.type === "IMAGE" ? (
                      <img
                        src={m.url}
                        alt={m.originalName}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : m.type === "VIDEO" ? (
                      <div className="flex size-full flex-col items-center justify-center bg-muted">
                        <Film className="size-6 text-muted-foreground" />
                        <span className="mt-1 text-[10px] text-muted-foreground">ویدیو</span>
                      </div>
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center bg-muted">
                        <FileText className="size-6 text-muted-foreground" />
                        <span className="mt-1 text-[10px] text-muted-foreground">فایل</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {m.originalName}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground nums-fa">
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}

        {/* Selected preview */}
        {selected.length > 0 && (
          <div className="rounded-lg bg-primary/5 p-2">
            <p className="mb-1.5 text-xs text-muted-foreground">
              {toPersianDigits(selected.length)} مورد انتخاب شده
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((m) => (
                <Badge key={m.id} variant="secondary" className="gap-1">
                  {m.type === "IMAGE" ? (
                    <img src={m.url} alt="" className="size-3 rounded-sm object-cover" />
                  ) : (
                    <FileText className="size-3" />
                  )}
                  <span className="max-w-[100px] truncate">{m.originalName}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelect(m)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={onConfirm} disabled={selected.length === 0}>
            تأیید انتخاب
            {selected.length > 0 && (
              <span className="mr-1 nums-fa">({toPersianDigits(selected.length)})</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Preview helpers (small components for showing picked media) ───────── */

export function MediaThumbnail({
  media,
  size = "md",
}: {
  media: { url: string; type?: string; originalName?: string } | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "size-8" : size === "lg" ? "size-20" : "size-12";
  if (!media) return null;
  if (media.type === "VIDEO") {
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-muted", sizeClass)}>
        <Film className="size-1/2 text-muted-foreground" />
      </div>
    );
  }
  if (media.type === "IMAGE" || !media.type) {
    return (
      <img
        src={media.url}
        alt={media.originalName ?? ""}
        className={cn("rounded-lg object-cover", sizeClass)}
      />
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded-lg bg-muted", sizeClass)}>
      <FileText className="size-1/2 text-muted-foreground" />
    </div>
  );
}

export function formatDateLabel(iso: string): string {
  return formatDateTimeFa(iso);
}
