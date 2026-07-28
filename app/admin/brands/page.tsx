"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { EntityImageField, type EntityImageValue } from "@/components/common/entity-image-field";
import { brandsService } from "@/services";
import type { Brand } from "@/types/domain";

/** Generate a URL-friendly slug from any input (Persian or English). */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
            header: "برند",
            render: (b) => (
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {b.logoUrl ? (
                     
                    <img src={b.logoUrl} alt={b.name} className="size-full object-contain" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {b.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    /{b.slug}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (b) => (
              <Badge variant={b.isActive ? "default" : "secondary"}>
                {b.isActive ? "فعال" : "غیرفعال"}
              </Badge>
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
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDescription, setMetaDescription] = React.useState("");
  const [logoValue, setLogoValue] = React.useState<EntityImageValue>({
    kind: "unchanged",
    previewUrl: null,
  });
  const [saving, setSaving] = React.useState(false);

  // Reset state when dialog opens.
  React.useEffect(() => {
    if (open) {
      setName(brand?.name ?? "");
      setSlug(brand?.slug ?? "");
      setSlugTouched(!!brand);
      setDescription(brand?.description ?? "");
      setIsActive(brand?.isActive ?? true);
      setMetaTitle(brand?.metaTitle ?? "");
      setMetaDescription(brand?.metaDescription ?? "");
      setLogoValue({ kind: "unchanged", previewUrl: brand?.logoUrl ?? null });
    }
  }, [open, brand]);

  // Auto-generate slug from name when user hasn't manually edited slug.
  React.useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      const finalSlug = slug.trim() ? slug.trim() : undefined;
      const baseBody = {
        name,
        slug: finalSlug,
        description: description.trim() || undefined,
        isActive,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      };

      // Decide route based on logo value:
      //  - kind === "file"     → multipart with file under field "logo"
      //  - kind === "mediaId"  → JSON with logoMediaId
      //  - kind === "removed"  → JSON with logoMediaId: null (only meaningful when editing)
      //  - kind === "unchanged"→ JSON only (no logoMediaId field)

      const hasFile = logoValue.kind === "file";
      const logoFile = hasFile ? (logoValue as { file: File }).file : undefined;
      const logoJsonFields =
        logoValue.kind === "mediaId"
          ? { logoMediaId: (logoValue as { mediaId: number }).mediaId }
          : logoValue.kind === "removed" && brand
          ? { logoMediaId: null }
          : {};

      const fullBody = { ...baseBody, ...logoJsonFields };

      if (brand) {
        if (logoFile) {
          await brandsService.updateWithLogo(brand.id, fullBody, logoFile);
        } else {
          await brandsService.update(brand.id, fullBody);
        }
        toast.success("برند به‌روزرسانی شد");
      } else {
        if (logoFile) {
          await brandsService.createWithLogo(fullBody, logoFile);
        } else {
          await brandsService.create(fullBody);
        }
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{brand ? "ویرایش برند" : "برند جدید"}</DialogTitle>
          <DialogDescription>اطلاعات برند را وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <EntityImageField
            label="لوگو برند"
            initialUrl={brand?.logoUrl}
            onChange={setLogoValue}
            disabled={saving}
            square
          />

          <div className="space-y-2">
            <Label>نام *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: اپل" />
          </div>
          <div className="space-y-2">
            <Label>اسلاگ (اختیاری)</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              dir="ltr"
              className="text-left"
              placeholder={name ? slugify(name) : "auto-generated"}
            />
            <p className="text-[11px] text-muted-foreground">
              اگر خالی بماند، از نام برند به‌صورت خودکار ساخته می‌شود.
            </p>
          </div>
          <div className="space-y-2">
            <Label>توضیحات</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* SEO section */}
          <div className="rounded-lg border border-border/60 p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">تنظیمات سئو (اختیاری)</p>
            <div className="space-y-2">
              <Label className="text-sm">عنوان متا</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="عنوان پیش‌فرض: نام برند"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">توضیحات متا</Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder="توضیح کوتاه برای موتورهای جستجو"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded"
            />
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
