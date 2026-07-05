"use client";

import * as React from "react";
import { Check, X, ArrowUpFromLine, Wallet as WalletIcon, RotateCcw } from "lucide-react";
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
  CardHeader,
  CardTitle,
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
            render: (w) => <span className="font-medium">{w.user?.fullName ?? `کاربر #${w.userId}`}</span>,
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
            key: "description",
            header: "توضیحات",
            render: (w) => (
              <span className="line-clamp-1 max-w-xs text-muted-foreground">
                {w.description ?? "—"}
              </span>
            ),
            hideOnMobile: true,
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
                <span className="text-xs text-muted-foreground">بررسی شده</span>
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

function ReviewWithdrawalDialog({
  target,
  onClose,
}: {
  target: WithdrawalRequest | null;
  onClose: () => void;
}) {
  const [decision, setDecision] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [adminNote, setAdminNote] = React.useState("");
  const review = useReviewWithdrawal();

  React.useEffect(() => {
    if (target) {
      setDecision("APPROVED");
      setAdminNote("");
    }
  }, [target]);

  if (!target) return null;

  const onSubmit = () => {
    review.mutate(
      { id: target.id, body: { status: decision, adminNote: adminNote.trim() || undefined } },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بررسی درخواست برداشت</DialogTitle>
          <DialogDescription>
            کاربر: {target.user?.fullName ?? `#${target.userId}`} — مبلغ:{" "}
            <span className="font-bold nums-fa">{toPersianDigits(formatPrice(target.amount))}</span> تومان
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {target.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">توضیحات کاربر:</p>
              <p>{target.description}</p>
            </div>
          )}

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            onClick={onSubmit}
            disabled={review.isPending || (decision === "REJECTED" && !adminNote.trim())}
            variant={decision === "APPROVED" ? "default" : "destructive"}
          >
            {review.isPending
              ? "در حال ثبت..."
              : decision === "APPROVED"
              ? "تایید نهایی"
              : "رد درخواست"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
