"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Film, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAdminStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
} from "@/features/admin/hooks";
import { mediaService } from "@/services";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { Story } from "@/types/domain";

export default function AdminStoriesPage() {
  const { data: stories, isLoading, isFetching, refetch } = useAdminStories();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Story | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Story) => {
    setEditing(s);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Film className="size-5 text-primary" />
            استوری‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت استوری‌های صفحه اصلی (تصویر کاور + ویدیو)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            به‌روزرسانی
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            استوری جدید
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] w-full rounded-xl" />
          ))}
        </div>
      ) : !stories || stories.length === 0 ? (
        <EmptyState
          icon={<Film className="size-12" />}
          title="استوری‌ای وجود ندارد"
          description="برای افزودن استوری، روی دکمه «استوری جدید» بزنید."
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} onEdit={() => openEdit(s)} />
          ))}
        </div>
      )}

      <StoryDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  );
}

function StoryCard({ story, onEdit }: { story: Story; onEdit: () => void }) {
  const deleteStory = useDeleteStory();
  const isExpired = story.expiresAt && new Date(story.expiresAt) < new Date();

  const onDelete = () => {
    if (!confirm("حذف این استوری؟")) return;
    deleteStory.mutate(story.id);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] w-full bg-muted">
        {story.coverImage?.url ? (
           
          <img
            src={story.coverImage.url}
            alt={story.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Film className="size-8 text-muted-foreground" />
          </div>
        )}
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge variant="destructive">منقضی</Badge>
          </div>
        )}
        {story.video && (
          <div className="absolute right-2 top-2">
            <Badge className="bg-black/60 text-white">
              <Eye className="size-3" />
              ویدیو
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="line-clamp-1 text-sm font-semibold">{story.title}</p>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="size-3" />
          {story.expiresAt ? `انقضا: ${formatDateTimeFa(story.expiresAt)}` : "بدون انقضا"}
        </div>
        {story.products && story.products.length > 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {toPersianDigits(story.products.length)} محصول مرتبط
          </p>
        )}
        <div className="mt-2 flex gap-1">
          <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={onEdit}>
            <Pencil className="size-3" />
            ویرایش
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={deleteStory.isPending}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StoryDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Story | null;
}) {
  const create = useCreateStory();
  const update = useUpdateStory();
  const [title, setTitle] = React.useState("");
  const [coverImageMediaId, setCoverImageMediaId] = React.useState<number | null>(null);
  const [videoMediaId, setVideoMediaId] = React.useState<number | null>(null);
  const [expiresAt, setExpiresAt] = React.useState("");
  const [order, setOrder] = React.useState("0");
  const [productIds, setProductIds] = React.useState("");
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [uploadingVideo, setUploadingVideo] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setCoverImageMediaId(editing?.coverImage?.mediaId ?? null);
      setVideoMediaId(editing?.video?.mediaId ?? null);
      setExpiresAt(editing?.expiresAt ?? "");
      setOrder(String(editing?.order ?? 0));
      setProductIds(editing?.products?.map((p) => p.id).join(",") ?? "");
    }
  }, [open, editing]);

  const onUploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const m = await mediaService.upload(file);
      setCoverImageMediaId(m.id);
      toast.success("تصویر کاور آپلود شد");
    } catch (e) {
      toast.error("آپلود ناموفق بود");
    } finally {
      setUploadingCover(false);
    }
  };

  const onUploadVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const m = await mediaService.upload(file);
      setVideoMediaId(m.id);
      toast.success("ویدیو آپلود شد");
    } catch (e) {
      toast.error("آپلود ناموفق بود");
    } finally {
      setUploadingVideo(false);
    }
  };

  const onSubmit = () => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    if (!coverImageMediaId) {
      toast.error("تصویر کاور الزامی است");
      return;
    }
    const body = {
      title: title.trim(),
      coverImageMediaId,
      videoMediaId: videoMediaId ?? undefined,
      expiresAt: expiresAt || undefined,
      order: Number(order) || 0,
      productIds: productIds
        ? productIds.split(",").map((s) => Number(s.trim())).filter(Boolean)
        : undefined,
    };
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش استوری" : "استوری جدید"}</DialogTitle>
          <DialogDescription>
            استوری با تصویر کاور (الزامی) و ویدیو (اختیاری) ساخته می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">عنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: استوری تابستانه" />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium">تصویر کاور (الزامی)</Label>
            {coverImageMediaId ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">mediaId: {toPersianDigits(coverImageMediaId)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setCoverImageMediaId(null)}>
                  حذف
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadCover(f);
                }}
              />
            )}
            {uploadingCover && <p className="mt-1 text-xs text-muted-foreground">در حال آپلود...</p>}
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium">ویدیو (اختیاری)</Label>
            {videoMediaId ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">mediaId: {toPersianDigits(videoMediaId)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setVideoMediaId(null)}>
                  حذف
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept="video/*"
                disabled={uploadingVideo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadVideo(f);
                }}
              />
            )}
            {uploadingVideo && <p className="mt-1 text-xs text-muted-foreground">در حال آپلود...</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">تاریخ انقضا</Label>
              <Input
                type="datetime-local"
                value={expiresAt ? expiresAt.slice(0, 16) : ""}
                onChange={(e) => setExpiresAt(e.target.value ? `${e.target.value}:00.000Z` : "")}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">ترتیب</Label>
              <Input type="number" dir="ltr" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium">محصولات مرتبط (IDs با کاما)</Label>
            <Input
              dir="ltr"
              className="text-left"
              placeholder="مثال: 1,5,12"
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">شناسه‌های محصول را با کاما جدا کنید.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button
            onClick={onSubmit}
            disabled={create.isPending || update.isPending || !title.trim() || !coverImageMediaId}
          >
            {create.isPending || update.isPending ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد استوری"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
