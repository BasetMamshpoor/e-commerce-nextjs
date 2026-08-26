"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
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
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import { discountCodesService, categoriesService } from "@/services";
import type { DiscountCode, DiscountType, PaginatedData, Category } from "@/types/domain";
import { formatPrice, toPersianDigits, formatDateTimeFa } from "@/utils/format";

export default function AdminDiscountCodesPage() {
  const [data, setData] = React.useState<PaginatedData<DiscountCode> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DiscountCode | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    discountCodesService.list({ page, limit: 20 }).then(setData).finally(() => setLoading(false));
  }, [page]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این کد تخفیف؟")) return;
    try {
      await discountCodesService.delete(id);
      toast.success("حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق — قبلاً استفاده شده");
    }
  };

  return (
    <>
      <AdminTable
        title="کدهای تخفیف"
        description="مدیریت کدهای تخفیف"
        columns={[
          {
            key: "code",
            header: "کد",
            render: (d) => (
              <span className="font-mono font-bold text-primary" dir="ltr">{d.code}</span>
            ),
          },
          {
            key: "type",
            header: "نوع",
            render: (d) => (
              <Badge variant="outline">
                {d.type === "PERCENT" ? `٪${toPersianDigits(d.value)}` : `${formatPrice(d.value)} تومان`}
              </Badge>
            ),
          },
          {
            key: "usage",
            header: "استفاده",
            align: "center",
            render: (d) => (
              <span className="text-xs nums-fa">
                {toPersianDigits(d.usedCount ?? 0)}
                {d.maxUsage ? ` / ${toPersianDigits(d.maxUsage)}` : ""}
              </span>
            ),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (d) => (
              <Badge variant={d.isActive ? "default" : "secondary"}>
                {d.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            ),
          },
          {
            key: "expiry",
            header: "انقضا",
            render: (d) => (
              <span className="text-xs text-muted-foreground">
                {d.expiresAt ? formatDateTimeFa(d.expiresAt) : "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (d) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setEditing(d);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:text-destructive"
                  onClick={() => handleDelete(d.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.items ?? []}
        isLoading={loading}
        getRowId={(d) => String(d.id)}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="کد تخفیفی موجود نیست"
        headerActions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            کد جدید
          </Button>
        }
      />

      <DiscountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discount={editing}
        onSaved={load}
      />
    </>
  );
}

function DiscountFormDialog({
  open,
  onOpenChange,
  discount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: DiscountCode | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    code: "",
    type: "PERCENT" as DiscountType,
    value: 10,
    maxDiscountAmount: "",
    minCartAmount: "",
    maxUsage: "",
    maxUsagePerUser: "1",
    isActive: true,
    startsAt: "",
    expiresAt: "",
    categoryIds: [] as number[],
  });
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        code: discount?.code ?? "",
        type: discount?.type ?? "PERCENT",
        value: discount?.value ?? 10,
        maxDiscountAmount: discount?.maxDiscountAmount?.toString() ?? "",
        minCartAmount: discount?.minCartAmount?.toString() ?? "",
        maxUsage: discount?.maxUsage?.toString() ?? "",
        maxUsagePerUser: discount?.maxUsagePerUser?.toString() ?? "1",
        isActive: discount?.isActive ?? true,
        // datetime-local inputs need "YYYY-MM-DDTHH:mm" — trim the
        // seconds/timezone off the ISO string the backend returns.
        startsAt: discount?.startsAt ? discount.startsAt.slice(0, 16) : "",
        expiresAt: discount?.expiresAt ? discount.expiresAt.slice(0, 16) : "",
        categoryIds: discount?.categoryIds ?? [],
      });
      categoriesService.tree().then(setCategoryTree).catch(() => {});
    }
  }, [open, discount]);

  const onSubmit = async () => {
    if (!form.code.trim()) {
      toast.error("کد الزامی است");
      return;
    }
    if (form.startsAt && form.expiresAt && form.expiresAt <= form.startsAt) {
      toast.error("تاریخ انقضا باید بعد از تاریخ شروع باشد");
      return;
    }
    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        minCartAmount: form.minCartAmount ? Number(form.minCartAmount) : undefined,
        maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined,
        maxUsagePerUser: form.maxUsagePerUser ? Number(form.maxUsagePerUser) : undefined,
        isActive: form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        categoryIds: form.categoryIds,
      };
      if (discount) {
        await discountCodesService.update(discount.id, body);
        toast.success("به‌روزرسانی شد");
      } else {
        await discountCodesService.create(body);
        toast.success("کد ایجاد شد");
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{discount ? "ویرایش کد" : "کد تخفیف جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>کد *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                dir="ltr"
                placeholder="SUMMER20"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DiscountType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">درصدی</SelectItem>
                  <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>مقدار *</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>سقف تخفیف (تومان)</Label>
              <Input
                type="number"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                placeholder="اختیاری"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>حداقل سبد (تومان)</Label>
              <Input
                type="number"
                value={form.minCartAmount}
                onChange={(e) => setForm({ ...form, minCartAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>حداکثر استفاده کل</Label>
              <Input
                type="number"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>حداکثر استفاده/کاربر</Label>
              <Input
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) => setForm({ ...form, maxUsagePerUser: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>تاریخ شروع</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>تاریخ انقضا</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              محدود به دسته‌بندی‌های خاص
              <span className="mr-1 text-xs text-muted-foreground">(خالی = همه‌ی محصولات)</span>
            </Label>
            <CategoryTreeSelect
              categories={categoryTree}
              selectedIds={form.categoryIds}
              onChange={(ids) => setForm({ ...form, categoryIds: ids })}
            />
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
