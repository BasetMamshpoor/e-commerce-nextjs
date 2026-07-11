"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminTable } from "@/features/admin/components/admin-table";
import { bannersService } from "@/services";
import type { Banner, BannerPosition } from "@/types/domain";

const POSITION_LABELS: Record<BannerPosition, string> = {
  HOME_MAIN: "اسلایدر اصلی",
  HOME_MIDDLE: "بنر وسط",
  CATEGORY_TOP: "بالای دسته",
  SIDEBAR: "ستون کناری",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Banner | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    bannersService.adminList().then(setBanners).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <>
      <AdminTable
        title="بنرها"
        description="مدیریت بنرهای صفحه اصلی و دسته‌بندی‌ها"
        columns={[
          {
            key: "image",
            header: "تصویر",
            render: (b) => {
              const url = b.media?.url ?? b.imageUrl;
              return (
                <div className="size-12 overflow-hidden rounded-lg bg-muted">
                  {url ? (
                     
                    <img src={url} alt={b.title} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center"><ImageIcon className="size-4 text-muted-foreground" /></div>
                  )}
                </div>
              );
            },
          },
          {
            key: "title",
            header: "عنوان",
            render: (b) => <span className="font-medium text-foreground">{b.title}</span>,
          },
          {
            key: "position",
            header: "موقعیت",
            render: (b) => <Badge variant="outline">{POSITION_LABELS[b.position] ?? b.position}</Badge>,
          },
          {
            key: "status",
            header: "وضعیت",
            render: (b) => <Badge variant={b.isActive ? "default" : "secondary"}>{b.isActive ? "فعال" : "غیرفعال"}</Badge>,
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (b) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(b); setDialogOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" onClick={async () => { if (!confirm("حذف؟")) return; await bannersService.delete(b.id); toast.success("حذف شد"); load(); }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={banners}
        isLoading={loading}
        getRowId={(b) => String(b.id)}
        emptyTitle="بنری موجود نیست"
        headerActions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> بنر جدید
          </Button>
        }
      />
      <BannerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} banner={editing} onSaved={load} />
    </>
  );
}

function BannerFormDialog({ open, onOpenChange, banner, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [position, setPosition] = React.useState<BannerPosition>("HOME_MAIN");
  const [link, setLink] = React.useState("");
  const [order, setOrder] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);
  const [image, setImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(banner?.title ?? "");
      setPosition(banner?.position ?? "HOME_MAIN");
      setLink(banner?.link ?? "");
      setOrder(String(banner?.order ?? 0));
      setIsActive(banner?.isActive ?? true);
      setImage(null);
      setImagePreview(banner?.media?.url ?? banner?.imageUrl ?? null);
    }
  }, [open, banner]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        position,
        link: link.trim() || undefined,
        order: Number(order) || 0,
        isActive,
      };

      if (banner) {
        if (image) {
          await bannersService.updateWithImage(banner.id, body, image);
        } else {
          await bannersService.update(banner.id, body);
        }
        toast.success("بنر به‌روزرسانی شد");
      } else {
        if (image) {
          await bannersService.createWithImage(body, image);
        } else {
          await bannersService.create(body);
        }
        toast.success("بنر ایجاد شد");
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
          <DialogTitle>{banner ? "ویرایش بنر" : "بنر جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: جشنواره تابستانه" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>موقعیت</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as BannerPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POSITION_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ترتیب</Label>
              <Input type="number" dir="ltr" className="text-left" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>تصویر بنر</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl">
                { }
                <img src={imagePreview} alt="preview" className="aspect-[16/6] w-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute left-2 top-2 size-8" onClick={removeImage}>
                  <X className="size-4" />
                </Button>
                {!image && <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">تصویر فعلی</p>}
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex aspect-[16/6] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/30">
                <Upload className="mb-2 size-8" />
                <span className="text-sm font-medium">تصویر بنر را آپلود کنید</span>
                <span className="mt-1 text-xs">پیشنهاد: ۱۲۰۰×۴۰۰ پیکسل</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>لینک</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" className="text-left" placeholder="/products?hasDiscount=true" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
            <span className="text-sm">فعال</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
