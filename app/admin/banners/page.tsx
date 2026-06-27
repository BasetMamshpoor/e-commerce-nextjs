"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Image as BannerIcon } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AdminTable
        title="بنرها"
        description="مدیریت بنرهای تبلیغاتی"
        columns={[
          {
            key: "title",
            header: "عنوان",
            render: (b) => (
              <div className="flex items-center gap-2">
                {b.imageUrl && (
                  <img src={b.imageUrl} alt={b.title} className="size-10 rounded-md object-cover" />
                )}
                <span className="font-medium text-foreground">{b.title}</span>
              </div>
            ),
          },
          {
            key: "position",
            header: "موقعیت",
            render: (b) => <Badge variant="outline">{POSITION_LABELS[b.position]}</Badge>,
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:text-destructive"
                  onClick={async () => {
                    if (!confirm("حذف؟")) return;
                    await bannersService.delete(b.id);
                    toast.success("حذف شد");
                    load();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={banners}
        isLoading={loading}
        getRowId={(b) => b.id}
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
  const [form, setForm] = React.useState({
    title: "",
    mediaId: "",
    link: "",
    position: "HOME_MAIN" as BannerPosition,
    order: 0,
    isActive: true,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        title: banner?.title ?? "",
        mediaId: banner?.mediaId ?? "",
        link: banner?.link ?? "",
        position: banner?.position ?? "HOME_MAIN",
        order: banner?.order ?? 0,
        isActive: banner?.isActive ?? true,
      });
    }
  }, [open, banner]);

  const onSubmit = async () => {
    if (!form.title.trim() || !form.mediaId.trim()) {
      toast.error("عنوان و تصویر الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, mediaId: form.mediaId };
      if (banner) {
        await bannersService.update(banner.id, body);
        toast.success("به‌روزرسانی شد");
      } else {
        await bannersService.create(body);
        toast.success("بنر ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banner ? "ویرایش بنر" : "بنر جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Media ID *</Label>
            <Input value={form.mediaId} onChange={(e) => setForm({ ...form, mediaId: e.target.value })} dir="ltr" placeholder="از کتابخانه رسانه کپی کنید" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>موقعیت</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v as BannerPosition })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POSITION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ترتیب</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>لینک</Label>
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} dir="ltr" placeholder="/products?hasDiscount=true" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
            <span className="text-sm">فعال</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? "..." : "ذخیره"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
