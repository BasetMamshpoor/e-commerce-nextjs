"use client";

import * as React from "react";
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, FileText, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { mediaService } from "@/services";
import type { PaginatedData, Media, MediaUsage } from "@/types/domain";
import { cn } from "@/lib/utils";

export default function AdminMediaPage() {
  const [data, setData] = React.useState<PaginatedData<Media> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [usageTarget, setUsageTarget] = React.useState<Media | null>(null);
  const [usageData, setUsageData] = React.useState<MediaUsage[] | null>(null);
  const [usageLoading, setUsageLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    mediaService.list({ page: 1, limit: 60 }).then(setData).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      if (files.length === 1) {
        await mediaService.upload(files[0]);
        toast.success("فایل آپلود شد");
      } else {
        await mediaService.bulkUpload(files);
        toast.success(`${files.length} فایل آپلود شد`);
      }
      load();
    } catch {
      toast.error("آپلود ناموفق بود");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("آدرس کپی شد");
  };

  const onDelete = async (id: number) => {
    if (!confirm("آیا از حذف این فایل مطمئن هستید؟")) return;
    try {
      await mediaService.delete(id);
      toast.success("فایل حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق بود —可能在 جایی استفاده شده");
    }
  };

  const onShowUsage = async (m: Media) => {
    setUsageTarget(m);
    setUsageData(null);
    setUsageLoading(true);
    try {
      const result = await mediaService.usage(m.id);
      setUsageData(result.usage);
    } catch {
      toast.error("بارگذاری محل استفاده ناموفق بود");
      setUsageTarget(null);
    } finally {
      setUsageLoading(false);
    }
  };

  const media = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">کتابخانه رسانه</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            آپلود و مدیریت تصاویر و فایل‌ها
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          آپلود فایل
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={onUpload}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-16" />}
          title="هنوز فایلی آپلود نشده"
          description="برای افزودن، روی دکمه آپلود کلیک کنید."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              آپلود اولین فایل
            </Button>
          }
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {media.map((m) => (
            <Card key={m.id} className="group overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {m.type === "IMAGE" ? (
                  <img
                    src={m.url}
                    alt={m.originalName}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <FileText className="size-12" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8"
                    onClick={() => onShowUsage(m)}
                    aria-label="محل استفاده"
                  >
                    <Info className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8"
                    onClick={() => onCopyUrl(m.url)}
                    aria-label="کپی آدرس"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-8"
                    onClick={() => onDelete(m.id)}
                    aria-label="حذف"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {m.url.split("/").pop()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage dialog — shows where this media is used */}
      <Dialog open={!!usageTarget} onOpenChange={(open) => !open && setUsageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>محل استفاده از فایل</DialogTitle>
            <DialogDescription>
              {usageTarget?.originalName} — لیست موجودیت‌هایی که از این رسانه استفاده می‌کنند.
            </DialogDescription>
          </DialogHeader>
          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !usageData || usageData.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              این فایل در هیچ‌کجا استفاده نشده است.
            </div>
          ) : (
            <div className="space-y-2">
              {usageData.map((u, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{u.entityType}</Badge>
                    <span className="text-sm text-foreground">{u.entityName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground nums-fa">#{u.entityId}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
