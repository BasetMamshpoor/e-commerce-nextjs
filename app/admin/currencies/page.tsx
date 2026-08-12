"use client";

import * as React from "react";
import { Plus, Pencil, RefreshCw, Loader2, Coins, TrendingUp, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { AdminTable } from "@/features/admin/components/admin-table";
import { currenciesService } from "@/services";
import type { Currency } from "@/types/domain";
import { formatDateTimeFa, formatPrice, toPersianDigits } from "@/utils/format";

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = React.useState<Currency[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Currency | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    currenciesService
      .adminList()
      .then(setCurrencies)
      .catch(() => toast.error("بارگذاری ارزها ناموفق بود"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">ارزها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت ارزها و نرخ‌های تبدیل برای قیمت‌گذاری ارزی محصولات
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            <span className="hidden sm:inline">به‌روزرسانی</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            ارز جدید
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900/50 dark:bg-blue-950/30">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium">نرخ‌ها به‌صورت خودکار از APIهای BRS و Navasan دریافت می‌شوند.</p>
          <p className="mt-1">برای بازنویسی دستی نرخ، روی ویرایش کلیک کرده و فیلد «نرخ دستی» را پر کنید. نرخ دستی بلافاصله روی همه محصولات با آن ارز اعمال می‌شود.</p>
        </div>
      </div>

      <AdminTable
        title=""
        columns={[
          {
            key: "code",
            header: "کد",
            render: (c) => (
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Coins className="size-4" />
                </div>
                <div>
                  <p className="font-mono font-medium" dir="ltr">{c.code}</p>
                  <p className="text-xs text-muted-foreground">{c.symbol}</p>
                </div>
              </div>
            ),
          },
          {
            key: "name",
            header: "نام",
            render: (c) => <span className="text-sm">{c.name}</span>,
          },
          {
            key: "rate",
            header: "آخرین نرخ",
            render: (c) =>
              c.currentRate ? (
                <div>
                  <p className="font-bold nums-fa">{toPersianDigits(formatPrice(c.currentRate))}</p>
                  <p className="text-[10px] text-muted-foreground">تومان</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "updatedAt",
            header: "زمان بروزرسانی",
            hideOnMobile: true,
            render: (c) =>
              c.lastFetchedAt ? (
                <span className="text-xs text-muted-foreground">{formatDateTimeFa(c.lastFetchedAt)}</span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
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
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setEditing(c)}
              >
                <Pencil className="size-4" />
              </Button>
            ),
          },
        ]}
        data={currencies}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        emptyTitle="ارزی یافت نشد"
      />

      <CreateCurrencyDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={load} />
      <EditCurrencyDialog currency={editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}

/* ───────── Create dialog ───────── */

function CreateCurrencyDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCode("");
      setName("");
      setSymbol("");
    }
  }, [open]);

  const onSubmit = async () => {
    if (!code.trim() || !name.trim() || !symbol.trim()) {
      toast.error("کد، نام و نماد الزامی هستند");
      return;
    }
    setSaving(true);
    try {
      await currenciesService.create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim(),
      });
      toast.success("ارز ایجاد شد");
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ایجاد ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ارز جدید</DialogTitle>
          <DialogDescription>یک ارز جدید برای قیمت‌گذاری ارزی محصولات اضافه کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>کد ارز *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="USD"
                dir="ltr"
                className="text-left font-mono"
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <Label>نماد *</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="$"
                dir="ltr"
                className="text-left"
                maxLength={5}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>نام (فارسی) *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="دلار آمریکا"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            ارز جدید به‌صورت پیش‌فرض فعال ایجاد می‌شود. برای غیرفعال‌ کردن، بعد از ایجاد آن را ویرایش کنید.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : "ایجاد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Edit dialog (with manual rate override) ───────── */

function EditCurrencyDialog({
  currency,
  onClose,
  onSaved,
}: {
  currency: Currency | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [currentRate, setCurrentRate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (currency) {
      setName(currency.name);
      setIsActive(currency.isActive);
      setCurrentRate("");
    }
  }, [currency]);

  if (!currency) return null;

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body: { name?: string; isActive?: boolean; currentRate?: number } = {
        name: name.trim(),
        isActive,
      };
      if (currentRate.trim()) {
        const rate = Number(currentRate);
        if (!rate || rate <= 0) {
          toast.error("نرخ باید عددی مثبت باشد");
          setSaving(false);
          return;
        }
        body.currentRate = rate;
      }
      await currenciesService.update(currency.id, body);
      toast.success("ارز به‌روزرسانی شد");
      if (currentRate.trim()) {
        toast.success("نرخ روی محصولات اعمال شد", {
          description: `${toPersianDigits(formatPrice(Number(currentRate)))} تومان`,
        });
      }
      onClose();
      onSaved();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "به‌روزرسانی ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!currency} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش ارز</DialogTitle>
          <DialogDescription>
            <span className="font-mono" dir="ltr">{currency.code}</span> ({currency.symbol}) — {currency.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Current rate info */}
          {currency.currentRate && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">نرخ فعلی (آخرین fetch):</p>
                  <p className="font-bold nums-fa">
                    {toPersianDigits(formatPrice(currency.currentRate))} تومان
                  </p>
                </div>
                {currency.lastFetchedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTimeFa(currency.lastFetchedAt)}
                  </span>
                )}
              </div>
              {currency.lastAppliedRate && (
                <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                  <Check className="size-3.5 text-success" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">آخرین نرخ اعمال‌شده روی محصولات:</p>
                    <p className="font-medium nums-fa">
                      {toPersianDigits(formatPrice(currency.lastAppliedRate))} تومان
                    </p>
                  </div>
                  {currency.lastAppliedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTimeFa(currency.lastAppliedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>نام (فارسی) *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded"
            />
            <span className="text-sm">فعال (دریافت خودکار نرخ)</span>
          </label>

          {/* Manual rate override */}
          <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <Label className="text-xs font-medium text-amber-700 dark:text-amber-400">
              بازنویسی دستی نرخ (اختیاری)
            </Label>
            <Input
              type="number"
              value={currentRate}
              onChange={(e) => setCurrentRate(e.target.value)}
              placeholder="مثلاً 195000"
              dir="ltr"
              className="text-left nums-fa"
            />
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              اگر پر شود، نرخ جدید ثبت شده و بلافاصله روی همه محصولات با این ارز اعمال می‌شود.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
