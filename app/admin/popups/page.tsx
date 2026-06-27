"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
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

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AdminTable
        title="پاپ‌آپ‌ها"
        description="مدیریت پاپ‌آپ‌های تبلیغاتی"
        columns={[
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
            render: (p) => (
              <span className="text-xs text-muted-foreground">
                {p.showOncePerSession ? "یک‌بار/جلسه" : "همیشه"}
              </span>
            ),
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:text-destructive"
                  onClick={async () => {
                    if (!confirm("حذف؟")) return;
                    await popupsService.delete(p.id);
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
        data={popups}
        isLoading={loading}
        getRowId={(p) => p.id}
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
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    mediaId: "",
    link: "",
    isActive: true,
    showOncePerSession: true,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        title: popup?.title ?? "",
        content: popup?.content ?? "",
        mediaId: popup?.mediaId ?? "",
        link: popup?.link ?? "",
        isActive: popup?.isActive ?? true,
        showOncePerSession: popup?.showOncePerSession ?? true,
      });
    }
  }, [open, popup]);

  const onSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("عنوان و محتوا الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, mediaId: form.mediaId || null };
      if (popup) {
        await popupsService.update(popup.id, body);
        toast.success("به‌روزرسانی شد");
      } else {
        await popupsService.create(body);
        toast.success("پاپ‌آپ ایجاد شد");
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
          <DialogTitle>{popup ? "ویرایش پاپ‌آپ" : "پاپ‌آپ جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>محتوا *</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Media ID (اختیاری)</Label>
            <Input value={form.mediaId} onChange={(e) => setForm({ ...form, mediaId: e.target.value })} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>لینک</Label>
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} dir="ltr" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
              <span className="text-sm">فعال</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.showOncePerSession} onChange={(e) => setForm({ ...form, showOncePerSession: e.target.checked })} className="size-4 rounded" />
              <span className="text-sm">یک‌بار در هر جلسه</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? "..." : "ذخیره"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
