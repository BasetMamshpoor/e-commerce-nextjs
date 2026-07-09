"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Film, Eye, X, Upload, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AdminTable } from "@/features/admin/components/admin-table";
import { PersianDatePicker } from "@/components/common/persian-date-picker";
import { storiesService, productsService } from "@/services";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { Story, Product, PaginatedData } from "@/types/domain";

export default function AdminStoriesPage() {
  const [data, setData] = React.useState<PaginatedData<Story> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Story | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    storiesService
      .adminList({ page, limit: 20 })
      .then((res) => setData(res as unknown as PaginatedData<Story>))
      .catch(() => toast.error("بارگذاری استوری‌ها ناموفق بود"))
      .finally(() => setLoading(false));
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Film className="size-5 text-primary" />
            استوری‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت استوری‌های صفحه اصلی</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" />
          استوری جدید
        </Button>
      </div>

      <AdminTable
        title=""
        columns={[
          {
            key: "cover",
            header: "کاور",
            render: (s) => {
              const url = s.coverImage?.url ?? s.coverImageUrl;
              return (
                <div className="size-12 overflow-hidden rounded-lg bg-muted">
                  {url ? (
                     
                    <img src={url} alt={s.title} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center"><Film className="size-4 text-muted-foreground" /></div>
                  )}
                </div>
              );
            },
          },
          {
            key: "title",
            header: "عنوان",
            render: (s) => (
              <div>
                <p className="font-medium text-foreground">{s.title}</p>
                {(s.video?.url ?? s.videoUrl) && <Badge variant="secondary" className="mt-1 text-[10px]"><Eye className="size-2.5" /> ویدیو</Badge>}
              </div>
            ),
          },
          {
            key: "expiresAt",
            header: "انقضا",
            hideOnMobile: true,
            render: (s) => {
              if (!s.expiresAt) return <span className="text-xs text-muted-foreground">بدون انقضا</span>;
              const expired = new Date(s.expiresAt) < new Date();
              return (
                <span className={`text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                  {formatDateTimeFa(s.expiresAt)}
                  {expired && " (منقضی)"}
                </span>
              );
            },
          },
          {
            key: "actions",
            header: "عملیات",
            align: "left",
            render: (s) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                  <Pencil className="size-3.5" /> ویرایش
                </Button>
                <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("حذف این استوری؟")) storiesService.delete(s.id).then(() => { toast.success("حذف شد"); load(); }).catch(() => toast.error("حذف ناموفق بود")); }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={items}
        isLoading={loading}
        getRowId={(s) => String(s.id)}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        emptyTitle="استوری‌ای وجود ندارد"
      />

      <StoryDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={load} />
    </div>
  );
}

/* ───────── Story create/edit dialog ───────── */
function StoryDialog({
  open, onOpenChange, editing, onSuccess,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; editing: Story | null; onSuccess: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState("0");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [video, setVideo] = React.useState<File | null>(null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // Related products selector
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setExpiresAt(editing?.expiresAt ?? null);
      setOrder(String(editing?.order ?? 0));
      setCoverImage(null);
      setCoverPreview(editing?.coverImage?.url ?? editing?.coverImageUrl ?? null);
      setVideo(null);
      setVideoPreview(editing?.video?.url ?? editing?.videoUrl ?? null);
      setSelectedProducts(editing?.products ?? []);
      setProductSearch("");
      setSearchResults([]);
    }
  }, [open, editing]);

  // Product search
  React.useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      productsService.list({ search: productSearch, page: 1, limit: 10 })
        .then((d) => setSearchResults(d.items))
        .catch(() => {}).finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const onCoverSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCoverImage(f); setCoverPreview(URL.createObjectURL(f));
  };
  const onVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setVideo(f); setVideoPreview(URL.createObjectURL(f));
  };

  const addProduct = (p: Product) => {
    if (!selectedProducts.some((x) => x.id === p.id)) setSelectedProducts([...selectedProducts, p]);
    setProductSearch(""); setSearchResults([]);
  };
  const removeProduct = (id: number) => setSelectedProducts(selectedProducts.filter((p) => p.id !== id));

  const onSubmit = async () => {
    if (!title.trim()) { toast.error("عنوان الزامی است"); return; }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        expiresAt: expiresAt ?? undefined,
        order: Number(order) || 0,
        productIds: selectedProducts.length > 0 ? selectedProducts.map((p) => p.id) : undefined,
      };

      if (editing) {
        // Edit — use multipart if new files, else JSON
        if (coverImage || video) {
          await storiesService.updateWithMedia(editing.id, body, coverImage ?? undefined, video ?? undefined);
        } else {
          await storiesService.update(editing.id, body);
        }
        toast.success("استوری ویرایش شد");
      } else {
        // Create — use multipart if files provided, else JSON
        if (coverImage || video) {
          await storiesService.createWithMedia(body, coverImage ?? undefined, video ?? undefined);
        } else {
          await storiesService.create(body);
        }
        toast.success("استوری ایجاد شد");
      }
      onOpenChange(false);
      onSuccess();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش استوری" : "استوری جدید"}</DialogTitle>
          <DialogDescription>تصویر کاور و ویدیو را آپلود کنید.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: استوری تابستانه" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>تاریخ انقضا</Label>
              <PersianDatePicker value={expiresAt} onChange={setExpiresAt} placeholder="بدون انقضا" />
            </div>
            <div className="space-y-2">
              <Label>ترتیب</Label>
              <Input type="number" dir="ltr" className="text-left" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <Label>تصویر کاور</Label>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverSelected} className="hidden" />
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-xl">
                { }
                <img src={coverPreview} alt="cover" className="aspect-[9/16] w-32 object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute left-1 top-1 size-6" onClick={() => { setCoverImage(null); setCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = ""; }}>
                  <X className="size-3" />
                </Button>
                {!coverImage && <p className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[8px] text-white">فعلی</p>}
              </div>
            ) : (
              <button type="button" onClick={() => coverInputRef.current?.click()} className="flex aspect-[9/16] w-32 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40">
                <Upload className="size-6" />
              </button>
            )}
          </div>

          {/* Video */}
          <div className="space-y-2">
            <Label>ویدیو (اختیاری)</Label>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={onVideoSelected} className="hidden" />
            {videoPreview ? (
              <div className="relative">
                <video src={videoPreview} className="aspect-[9/16] w-32 rounded-xl" muted />
                <Button type="button" variant="destructive" size="icon" className="absolute left-1 top-1 size-6" onClick={() => { setVideo(null); setVideoPreview(null); if (videoInputRef.current) videoInputRef.current.value = ""; }}>
                  <X className="size-3" />
                </Button>
                {!video && <p className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[8px] text-white">فعلی</p>}
              </div>
            ) : (
              <button type="button" onClick={() => videoInputRef.current?.click()} className="flex aspect-[9/16] w-32 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40">
                <Film className="size-6" />
              </button>
            )}
          </div>

          {/* Related products */}
          <div className="space-y-2">
            <Label>محصولات مرتبط</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="جستجوی محصول..." className="pr-9" />
              {searching && <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />}
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                {searchResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-2 rounded-md p-2 text-right text-xs hover:bg-accent">
                    <Plus className="size-3 shrink-0 text-primary" /><span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProducts.length > 0 && (
              <div className="space-y-1">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <span className="truncate">{p.name}</span>
                    <button onClick={() => removeProduct(p.id)} className="text-destructive hover:text-destructive/80"><X className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد استوری"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
