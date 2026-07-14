"use client";

import * as React from "react";
import { Check, X, ArrowUpFromLine, Wallet as WalletIcon, RotateCcw, CreditCard, User, Hash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTable } from "@/features/admin/components/admin-table";
import { useAdminWithdrawals, useReviewWithdrawal } from "@/features/admin/hooks";
import { formatPrice, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { WithdrawalRequest } from "@/types/domain";

const STATUS_CONFIG: Record<WithdrawalRequest["status"], { label: string; variant: "outline" | "secondary" | "destructive" | "default" }> = {
  PENDING: { label: "در انتظار", variant: "secondary" },
  APPROVED: { label: "تایید شده", variant: "default" },
  REJECTED: { label: "رد شده", variant: "destructive" },
};

export default function AdminWithdrawalsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>("PENDING");
  const [reviewTarget, setReviewTarget] = React.useState<WithdrawalRequest | null>(null);

  const params = status === "ALL" ? { page, limit: 20 } : { page, limit: 20, status };
  const { data, isLoading, refetch, isFetching } = useAdminWithdrawals(params);

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Stats by counting visible items per status — quick approach.
  const pendingCount = items.filter((w) => w.status === "PENDING").length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/30">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">در انتظار (در صفحه فعلی)</p>
              <p className="text-lg font-bold nums-fa">{toPersianDigits(pendingCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30">
              <WalletIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">کل درخواست‌های صفحه</p>
              <p className="text-lg font-bold nums-fa">{toPersianDigits(items.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowUpFromLine className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مجموع کل</p>
              <p className="text-lg font-bold nums-fa">{toPersianDigits(total)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">وضعیت</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
              <SelectItem value="PENDING">در انتظار</SelectItem>
              <SelectItem value="APPROVED">تایید شده</SelectItem>
              <SelectItem value="REJECTED">رد شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RotateCcw className="size-4" />
          به‌روزرسانی
        </Button>
      </div>

      <AdminTable
        title="درخواست‌های برداشت کیف پول"
        description="بررسی و تایید درخواست‌های برداشت کاربران"
        columns={[
          {
            key: "id",
            header: "شناسه",
            render: (w) => <span className="nums-fa text-muted-foreground">#{toPersianDigits(w.id)}</span>,
            hideOnMobile: true,
          },
          {
            key: "user",
            header: "کاربر",
            render: (w) => (
              <div className="min-w-0">
                <p className="font-medium">{w.user?.fullName ?? `کاربر #${w.userId}`}</p>
                {w.bankAccountOwnerName && (
                  <p className="truncate text-xs text-muted-foreground">
                    صاحب حساب: {w.bankAccountOwnerName}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "amount",
            header: "مبلغ",
            render: (w) => (
              <span className="font-bold text-foreground nums-fa">
                {toPersianDigits(formatPrice(w.amount))}
                <span className="mr-1 text-xs font-normal text-muted-foreground">تومان</span>
              </span>
            ),
          },
          {
            key: "bank",
            header: "اطلاعات بانکی",
            hideOnMobile: true,
            render: (w) => (
              <div className="text-xs leading-tight">
                {w.bankSheba || w.bankCardNumber ? (
                  <>
                    {w.bankSheba && (
                      <p className="nums-fa text-muted-foreground" dir="ltr">
                        شبا: {w.bankSheba}
                      </p>
                    )}
                    {w.bankCardNumber && (
                      <p className="nums-fa text-muted-foreground" dir="ltr">
                        کارت: {w.bankCardNumber}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            ),
          },
          {
            key: "tracking",
            header: "کد پیگیری",
            hideOnMobile: true,
            render: (w) =>
              w.trackingCode ? (
                <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success nums-fa" dir="ltr">
                  {w.trackingCode}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (w) => {
              const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.PENDING;
              return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
            },
          },
          {
            key: "createdAt",
            header: "تاریخ",
            render: (w) => <span className="text-xs text-muted-foreground">{formatDateTimeFa(w.createdAt)}</span>,
            hideOnMobile: true,
          },
          {
            key: "actions",
            header: "عملیات",
            align: "left",
            render: (w) =>
              w.status === "PENDING" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setReviewTarget(w);
                  }}
                >
                  بررسی
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setReviewTarget(w);
                  }}
                >
                  مشاهده
                </Button>
              ),
          },
        ]}
        data={items}
        isLoading={isLoading}
        getRowId={(w) => String(w.id)}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Review dialog */}
      <ReviewWithdrawalDialog
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    </div>
  );
}

function BankDetailRow({
  icon,
  label,
  value,
  dir = "rtl",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  dir?: "rtl" | "ltr";
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground break-all" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ReviewWithdrawalDialog({
  target,
  onClose,
}: {
  target: WithdrawalRequest | null;
  onClose: () => void;
}) {
  const isReadOnly = target && target.status !== "PENDING";
  const [decision, setDecision] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [adminNote, setAdminNote] = React.useState("");
  const [trackingCode, setTrackingCode] = React.useState("");
  const review = useReviewWithdrawal();

  React.useEffect(() => {
    if (target) {
      setDecision("APPROVED");
      setAdminNote(target.adminNote ?? "");
      setTrackingCode(target.trackingCode ?? "");
    }
  }, [target]);

  if (!target) return null;

  const onSubmit = () => {
    if (decision === "REJECTED" && !adminNote.trim()) {
      toast.error("برای رد درخواست، یادداشت دلیل الزامی است");
      return;
    }
    review.mutate(
      {
        id: target.id,
        body: {
          status: decision,
          adminNote: adminNote.trim() || undefined,
          trackingCode: decision === "APPROVED" ? trackingCode.trim() || undefined : undefined,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? "جزئیات درخواست برداشت" : "بررسی درخواست برداشت"}
          </DialogTitle>
          <DialogDescription>
            کاربر: {target.user?.fullName ?? `#${target.userId}`} — مبلغ:{" "}
            <span className="font-bold nums-fa">{toPersianDigits(formatPrice(target.amount))}</span> تومان
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User's description */}
          {target.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">توضیحات کاربر:</p>
              <p>{target.description}</p>
            </div>
          )}

          {/* Bank account details */}
          {(target.bankSheba || target.bankCardNumber || target.bankAccountOwnerName) ? (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CreditCard className="size-3.5" />
                اطلاعات حساب بانکی
              </p>
              <div className="space-y-3">
                <BankDetailRow
                  icon={<User className="size-4" />}
                  label="نام صاحب حساب"
                  value={target.bankAccountOwnerName ?? null}
                />
                <BankDetailRow
                  icon={<Hash className="size-4" />}
                  label="شماره شبا (IR...)"
                  value={target.bankSheba ?? null}
                  dir="ltr"
                />
                <BankDetailRow
                  icon={<CreditCard className="size-4" />}
                  label="شماره کارت"
                  value={target.bankCardNumber ?? null}
                  dir="ltr"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              کاربر اطلاعات بانکی ثبت نکرده است
            </div>
          )}

          {/* Existing tracking code (for read-only) */}
          {isReadOnly && target.trackingCode && (
            <div className="rounded-lg bg-success/10 p-3 text-sm">
              <p className="mb-1 text-xs text-success">کد پیگیری پرداخت:</p>
              <p className="font-bold text-success nums-fa" dir="ltr">{target.trackingCode}</p>
            </div>
          )}

          {/* Existing admin note (for read-only) */}
          {isReadOnly && target.adminNote && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">یادداشت ادمین:</p>
              <p>{target.adminNote}</p>
            </div>
          )}

          {/* Decision + form (only when pending) */}
          {!isReadOnly && (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium">تصمیم</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("APPROVED")}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${
                      decision === "APPROVED"
                        ? "border-success bg-success/10 text-success"
                        : "border-border hover:border-success/40"
                    }`}
                  >
                    <Check className="size-4" />
                    تایید و پرداخت
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("REJECTED")}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${
                      decision === "REJECTED"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border hover:border-destructive/40"
                    }`}
                  >
                    <X className="size-4" />
                    رد درخواست
                  </button>
                </div>
              </div>

              {/* Tracking code (when approving) */}
              {decision === "APPROVED" && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    کد پیگیری پرداخت (اختیاری)
                  </Label>
                  <Input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    dir="ltr"
                    className="text-left"
                    placeholder="مثال: TRK-1001"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    این کد پس از تایید به کاربر نمایش داده می‌شود
                  </p>
                </div>
              )}

              <div>
                <Label className="mb-2 block text-sm font-medium">
                  یادداشت ادمین {decision === "REJECTED" ? "(توضیح دلیل رد)" : "(اختیاری)"}
                </Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder={decision === "REJECTED" ? "دلیل رد درخواست را شرح دهید..." : "یادداشت داخلی..."}
                />
              </div>

              {decision === "APPROVED" && (
                <div className="rounded-lg bg-success/10 p-3 text-xs text-success">
                  با تایید، مبلغ {toPersianDigits(formatPrice(target.amount))} تومان از کیف پول کاربر کسر خواهد شد.
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {isReadOnly ? (
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                انصراف
              </Button>
              <Button
                onClick={onSubmit}
                disabled={review.isPending}
                variant={decision === "APPROVED" ? "default" : "destructive"}
              >
                {review.isPending
                  ? "در حال ثبت..."
                  : decision === "APPROVED"
                  ? "تایید نهایی"
                  : "رد درخواست"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
