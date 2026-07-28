"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Megaphone, Upload, X, Loader2, FolderOpen, Image as ImageIcon } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminTable } from "@/features/admin/components/admin-table";
import { MediaGalleryPicker } from "@/components/common/media-gallery-picker";
import { popupsService } from "@/services";
import type { Popup } from "@/types/domain";

export default function AdminPopupsPage() {
  const [popups, setPopups] = React.useState<Popup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Popup | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    popupsService.adminList().then(setPopups).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <>
      <AdminTable
        title="پاپ‌آپ‌ها"
        description="مدیریت پاپ‌آپ‌های تبلیغاتی"
        columns={[
          {
            key: "image",
            header: "تصویر",
            render: (p) => (
              <div className="size-10 overflow-hidden rounded-lg bg-muted">
                {p.mediaUrl ? (
                   
                  <img src={p.mediaUrl} alt={p.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center"><Megaphone className="size-4 text-muted-foreground" /></div>
                )}
              </div>
            ),
          },
          {
            key: "title",
            header: "عنوان",
            render: (p) => <span className="font-medium text-foreground">{p.title}</span>,
          },
          {
            key: "content",
            header: "محتوا",
            render: (p) => <span className="text-xs text-muted-foreground line-clamp-1">{p.content}</span>,
          },
          {
            key: "status",
            header: "وضعیت",
            render: (p) => <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "فعال" : "غیرفعال"}</Badge>,
          },
          {
            key: "session",
            header: "نمایش",
            render: (p) => <span className="text-xs text-muted-foreground">{p.showOncePerSession ? "یک‌بار/جلسه" : "همیشه"}</span>,
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (p) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" onClick={async () => { if (!confirm("حذف؟")) return; await popupsService.delete(p.id); toast.success("حذف شد"); load(); }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={popups}
        isLoading={loading}
        getRowId={(p) => String(p.id)}
        emptyTitle="پاپ‌آپی موجود نیست"
        headerActions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> پاپ‌آپ جدید
          </Button>
        }
      />
      <PopupFormDialog open={dialogOpen} onOpenChange={setDialogOpen} popup={editing} onSaved={load} />
    </>
  );
}

function PopupFormDialog({ open, onOpenChange, popup, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popup: Popup | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [link, setLink] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [showOncePerSession, setShowOncePerSession] = React.useState(true);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageMediaId, setImageMediaId] = React.useState<number | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = React.useState(false);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(popup?.title ?? "");
      setContent(popup?.content ?? "");
      setLink(popup?.link ?? "");
      setIsActive(popup?.isActive ?? true);
      setShowOncePerSession(popup?.showOncePerSession ?? true);
      setImageFile(null);
      setImageMediaId(null);
      setImagePreview(popup?.mediaUrl ?? null);
      setImageRemoved(false);
    }
  }, [open, popup]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImageMediaId(null);
    setImagePreview(URL.createObjectURL(f));
    setImageRemoved(false);
  };

  const onGallerySelect = (items: Array<{ id: number; url: string }>) => {
    if (items.length === 0) return;
    const picked = items[0];
    setImageFile(null);
    setImageMediaId(picked.id);
    setImagePreview(picked.url);
    setImageRemoved(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageMediaId(null);
    setImagePreview(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("عنوان و محتوا الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        content: content.trim(),
        link: link.trim() || undefined,
        isActive,
        showOncePerSession,
        // Attach mediaId when picking from gallery OR removing existing.
        ...(imageMediaId ? { mediaId: imageMediaId } : {}),
        ...(imageRemoved && !imageFile && popup ? { mediaId: null } : {}),
      };

      if (popup) {
        if (imageFile) {
          await popupsService.updateWithImage(popup.id, body, imageFile);
        } else {
          await popupsService.update(popup.id, body);
        }
        toast.success("به‌روزرسانی شد");
      } else {
        if (imageFile) {
          await popupsService.createWithImage(body, imageFile);
        } else {
          await popupsService.create(body);
        }
        toast.success("پاپ‌آپ ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{popup ? "ویرایش پاپ‌آپ" : "پاپ‌آپ جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>محتوا *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>تصویر (اختیاری)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl">
                <img src={imagePreview} alt="preview" className="aspect-[16/9] w-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute left-2 top-2 size-8" onClick={removeImage} disabled={saving}>
                  <X className="size-4" />
                </Button>
                {!imageFile && !imageMediaId && (
                  <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">تصویر فعلی</p>
                )}
                {imageMediaId && (
                  <p className="absolute bottom-2 right-2 rounded bg-primary/80 px-2 py-0.5 text-[10px] text-primary-foreground">از گالری</p>
                )}
                {imageFile && (
                  <p className="absolute bottom-2 right-2 rounded bg-success/80 px-2 py-0.5 text-[10px] text-white">آپلود جدید</p>
                )}
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
                <ImageIcon className="mb-2 size-8" />
                <span className="text-sm">تصویری انتخاب نشده</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                <Upload className="size-4" />
                آپلود از حافظه
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setGalleryOpen(true)} disabled={saving}>
                <FolderOpen className="size-4" />
                انتخاب از گالری
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>لینک</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" className="text-left" placeholder="/products?hasDiscount=true" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
              <span className="text-sm">فعال</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showOncePerSession} onChange={(e) => setShowOncePerSession(e.target.checked)} className="size-4 rounded" />
              <span className="text-sm">یک‌بار در هر جلسه</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <MediaGalleryPicker
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={onGallerySelect}
        multiple={false}
        allowedType="IMAGE"
        title="انتخاب تصویر پاپ‌آپ"
      />
    </Dialog>
  );
}
