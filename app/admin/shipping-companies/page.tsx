"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Truck, ImagePlus, X, Loader2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { AdminTable } from "@/features/admin/components/admin-table";
import { shippingCompaniesService } from "@/services";
import type { ShippingCompany, ShippingPricingType } from "@/types/domain";
import { formatPrice, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

interface LogoState {
  /** Display URL — backend logoUrl for existing, or object URL for newly picked file. */
  url: string | null;
  /** Pending File to upload on submit (multipart field "logo"). Null if no new file picked. */
  file: File | null;
  /** True if the user explicitly removed an existing logo (so we send logoMediaId=null on save). */
  removed: boolean;
}

export default function AdminShippingCompaniesPage() {
  const [companies, setCompanies] = React.useState<ShippingCompany[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingCompany | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    shippingCompaniesService.list({ includeInactive: true }).then(setCompanies).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await shippingCompaniesService.delete(deleteId); toast.success("حذف شد"); setDeleteId(null); load(); }
    catch { toast.error("حذف ناموفق — در سفارش استفاده شده"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      <AdminTable
        title="شرکت‌های ارسال"
        description="مدیریت شرکت‌های حمل و نقل"
        columns={[
          {
            key: "name",
            header: "شرکت",
            render: (c) => (
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {c.logoUrl ? (
                     
                    <img src={c.logoUrl} alt={c.name} className="size-full object-cover" />
                  ) : (
                    <Truck className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.pricingType === "WEIGHT_DISTANCE" ? "بر اساس وزن و مسافت" : "نرخ ثابت"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "cost",
            header: "هزینه",
            align: "left",
            hideOnMobile: true,
            render: (c) => (
              <div className="text-right">
                {c.pricingType === "FIXED" ? (
                  <span className="nums-fa">{formatPrice(c.baseCost)}</span>
                ) : (
                  <div className="text-xs leading-tight nums-fa">
                    <div>{formatPrice(c.pricePerKg ?? 0)} <span className="text-muted-foreground">/ کیلو</span></div>
                    <div>{formatPrice(c.pricePerKm ?? 0)} <span className="text-muted-foreground">/ کیلومتر</span></div>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "payment",
            header: "روش‌های پرداخت",
            hideOnMobile: true,
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                {c.acceptsPrepay && (
                  <Badge variant="secondary" className="text-[10px]">پیش‌پرداخت</Badge>
                )}
                {c.acceptsFreightCollect && (
                  <Badge variant="outline" className="text-[10px]">پرداخت در محل</Badge>
                )}
                {!c.acceptsPrepay && !c.acceptsFreightCollect && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ),
          },
          {
            key: "days",
            header: "زمان تحویل",
            hideOnMobile: true,
            render: (c) =>
              c.estimatedDaysMin
                ? `${toPersianDigits(c.estimatedDaysMin)}-${toPersianDigits(c.estimatedDaysMax ?? c.estimatedDaysMin)} روز`
                : "—",
          },
          {
            key: "status",
            header: "وضعیت",
            render: (c) => (
              <Badge variant={c.isActive ? "default" : "secondary"}>
                {c.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (c) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => { setEditing(c); setDialogOpen(true); }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteId(c.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={companies}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        emptyTitle="شرکتی یافت نشد"
        headerActions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" />
            شرکت جدید
          </Button>
        }
      />
      <ShippingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editing}
        onSaved={load}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف شرکت ارسال"
        description="آیا مطمئن هستید؟ اگر در سفارشی استفاده شده باشد، حذف امکان‌پذیر نخواهد بود."
        confirmText="حذف"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

interface FormState {
  name: string;
  pricingType: ShippingPricingType;
  baseCost: string;
  pricePerKg: string;
  pricePerKm: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  description: string;
  isActive: boolean;
  acceptsPrepay: boolean;
  acceptsFreightCollect: boolean;
}

function ShippingFormDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: ShippingCompany | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<FormState>({
    name: "",
    pricingType: "FIXED",
    baseCost: "",
    pricePerKg: "",
    pricePerKm: "",
    estimatedDaysMin: "",
    estimatedDaysMax: "",
    description: "",
    isActive: true,
    acceptsPrepay: true,
    acceptsFreightCollect: false,
  });
  const [logo, setLogo] = React.useState<LogoState>({ url: null, file: null, removed: false });
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: company?.name ?? "",
        pricingType: (company?.pricingType ?? "FIXED") as ShippingPricingType,
        baseCost: company?.baseCost?.toString() ?? "",
        pricePerKg: company?.pricePerKg?.toString() ?? "",
        pricePerKm: company?.pricePerKm?.toString() ?? "",
        estimatedDaysMin: company?.estimatedDaysMin?.toString() ?? "",
        estimatedDaysMax: company?.estimatedDaysMax?.toString() ?? "",
        description: company?.description ?? "",
        isActive: company?.isActive ?? true,
        acceptsPrepay: company?.acceptsPrepay ?? true,
        acceptsFreightCollect: company?.acceptsFreightCollect ?? false,
      });
      setLogo({
        url: company?.logoUrl ?? null,
        file: null,
        removed: false,
      });
    }
  }, [open, company]);

  const onLogoSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    // Preview locally — the actual upload happens on form submit via multipart.
    setLogo({ url: URL.createObjectURL(file), file, removed: false });
  };

  const removeLogo = () => {
    setLogo({ url: null, file: null, removed: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام شرکت الزامی است");
      return;
    }
    if (form.pricingType === "FIXED" && !form.baseCost) {
      toast.error("هزینه پایه برای نرخ ثابت الزامی است");
      return;
    }
    if (form.pricingType === "WEIGHT_DISTANCE") {
      if (!form.pricePerKg || !form.pricePerKm) {
        toast.error("برای محاسبه بر اساس وزن و مسافت، هر دو فیلد قیمت لازم است");
        return;
      }
    }
    if (!form.acceptsPrepay && !form.acceptsFreightCollect) {
      toast.error("حداقل یکی از روش‌های پرداخت باید فعال باشد");
      return;
    }

    setSaving(true);
    try {
      const baseBody = {
        name: form.name,
        pricingType: form.pricingType,
        baseCost: form.pricingType === "FIXED" ? Number(form.baseCost) : 0,
        pricePerKg: form.pricingType === "WEIGHT_DISTANCE" ? Number(form.pricePerKg) : undefined,
        pricePerKm: form.pricingType === "WEIGHT_DISTANCE" ? Number(form.pricePerKm) : undefined,
        estimatedDaysMin: form.estimatedDaysMin ? Number(form.estimatedDaysMin) : undefined,
        estimatedDaysMax: form.estimatedDaysMax ? Number(form.estimatedDaysMax) : undefined,
        description: form.description || undefined,
        isActive: form.isActive,
        acceptsPrepay: form.acceptsPrepay,
        acceptsFreightCollect: form.acceptsFreightCollect,
        // Only send logoMediaId when explicitly removing the existing logo
        // (no new file to upload). When a new file is being uploaded via
        // multipart, the backend ignores this field and uses the file.
        ...(logo.removed && !logo.file && company ? { logoMediaId: null } : {}),
      };
      if (company) {
        if (logo.file) {
          await shippingCompaniesService.updateWithLogo(company.id, baseBody, logo.file);
        } else {
          await shippingCompaniesService.update(company.id, baseBody);
        }
        toast.success("به‌روزرسانی شد");
      } else {
        if (logo.file) {
          await shippingCompaniesService.createWithLogo(baseBody, logo.file);
        } else {
          await shippingCompaniesService.create(baseBody);
        }
        toast.success("ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const isWeightDistance = form.pricingType === "WEIGHT_DISTANCE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{company ? "ویرایش شرکت" : "شرکت جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Logo uploader */}
          <div className="space-y-2">
            <Label>لوگو شرکت</Label>
            <div className="flex items-center gap-4">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                {logo.url ? (
                  <img src={logo.url} alt="logo" className="size-full object-contain" />
                ) : (
                  <ImagePlus className="size-7 text-muted-foreground" />
                )}
                {saving && logo.file && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogoSelected(e.target.files)}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <ImagePlus className="size-4" />
                    {logo.url ? "تغییر لوگو" : "انتخاب لوگو"}
                  </Button>
                  {logo.url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      disabled={saving}
                    >
                      <X className="size-4" />
                      حذف
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  فرمت: JPG, PNG, WebP — حداکثر ۲ مگابایت
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>نام شرکت *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Pricing type */}
          <div className="space-y-2">
            <Label>مدل محاسبه هزینه *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, pricingType: "FIXED" })}
                className={cn(
                  "rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                  !isWeightDistance
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                نرخ ثابت
                <p className="mt-0.5 text-xs text-muted-foreground">یک نرخ یکسان برای همه سفارش‌ها</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, pricingType: "WEIGHT_DISTANCE" })}
                className={cn(
                  "rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                  isWeightDistance
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                وزن و مسافت
                <p className="mt-0.5 text-xs text-muted-foreground">بر اساس وزن بسته + مسافت</p>
              </button>
            </div>
          </div>

          {/* Conditional pricing fields */}
          {isWeightDistance ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>هزینه به ازای هر کیلوگرم (تومان) *</Label>
                <Input
                  type="number"
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                  dir="ltr"
                  placeholder="مثال: 15000"
                />
              </div>
              <div className="space-y-2">
                <Label>هزینه به ازای هر کیلومتر (تومان) *</Label>
                <Input
                  type="number"
                  value={form.pricePerKm}
                  onChange={(e) => setForm({ ...form, pricePerKm: e.target.value })}
                  dir="ltr"
                  placeholder="مثال: 2000"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>هزینه پایه (تومان) *</Label>
              <Input
                type="number"
                value={form.baseCost}
                onChange={(e) => setForm({ ...form, baseCost: e.target.value })}
                dir="ltr"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>حداقل روز تحویل</Label>
              <Input
                type="number"
                value={form.estimatedDaysMin}
                onChange={(e) => setForm({ ...form, estimatedDaysMin: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>حداکثر روز تحویل</Label>
              <Input
                type="number"
                value={form.estimatedDaysMax}
                onChange={(e) => setForm({ ...form, estimatedDaysMax: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>توضیحات</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Payment options */}
          <div className="space-y-2">
            <Label>روش‌های پرداخت مجاز</Label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-border p-3 hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={form.acceptsPrepay}
                  onChange={(e) => setForm({ ...form, acceptsPrepay: e.target.checked })}
                  className="mt-0.5 size-4 rounded"
                />
                <div>
                  <p className="text-sm font-medium">پیش‌پرداخت</p>
                  <p className="text-xs text-muted-foreground">
                    درگاه بانکی، کیف پول یا پرداخت ترکیبی — مبلغ پیش از ارسال پرداخت می‌شود
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-border p-3 hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={form.acceptsFreightCollect}
                  onChange={(e) => setForm({ ...form, acceptsFreightCollect: e.target.checked })}
                  className="mt-0.5 size-4 rounded"
                />
                <div>
                  <p className="text-sm font-medium">پرداخت در محل (COD)</p>
                  <p className="text-xs text-muted-foreground">
                    مبلغ سفارش هنگام تحویل توسط شرکت حمل از مشتری دریافت می‌شود
                  </p>
                </div>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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
