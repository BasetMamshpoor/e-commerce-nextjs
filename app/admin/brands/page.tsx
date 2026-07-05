"use client";

import * as React from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState } from "@/components/common/empty-state";
import { AdminTable } from "@/features/admin/components/admin-table";
import { brandsService } from "@/services";
import type { Brand } from "@/types/domain";

export default function AdminBrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Brand | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    brandsService.list({ includeInactive: true }).then(setBrands).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این برند؟")) return;
    try {
      await brandsService.delete(id);
      toast.success("برند حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق — دارای محصول است");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">برندها</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت برندهای محصولات</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          برند جدید
        </Button>
      </div>

      <AdminTable
        title=""
        columns={[
          {
            key: "name",
            header: "نام برند",
            render: (b) => <span className="font-medium text-foreground">{b.name}</span>,
          },
          {
            key: "slug",
            header: "اسلاگ",
            render: (b) => <span className="text-xs text-muted-foreground" dir="ltr">/{b.slug}</span>,
          },
          {
            key: "status",
            header: "وضعیت",
            render: (b) => (
              <span className={`text-xs ${b.isActive ? "text-green-600" : "text-red-600"}`}>
                {b.isActive ? "فعال" : "غیرفعال"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (b) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setEditing(b);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(b.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={brands}
        isLoading={loading}
        getRowId={(b) => String(b.id)}
        emptyTitle="برندی یافت نشد"
      />

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={editing}
        onSaved={load}
      />
    </div>
  );
}

function BrandFormDialog({
  open,
  onOpenChange,
  brand,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(brand?.name ?? "");
      setSlug(brand?.slug ?? "");
      setDescription(brand?.description ?? "");
      setIsActive(brand?.isActive ?? true);
    }
  }, [open, brand]);

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = { name, slug: slug || undefined, description: description || undefined, isActive };
      if (brand) {
        await brandsService.update(brand.id, body);
        toast.success("برند به‌روزرسانی شد");
      } else {
        await brandsService.create(body);
        toast.success("برند ایجاد شد");
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
          <DialogTitle>{brand ? "ویرایش برند" : "برند جدید"}</DialogTitle>
          <DialogDescription>اطلاعات برند را وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>اسلاگ (اختیاری)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>توضیحات</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
            <span className="text-sm">فعال</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
