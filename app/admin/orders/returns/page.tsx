"use client";

import * as React from "react";
import { RotateCcw, Check, X, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminTable } from "@/features/admin/components/admin-table";
import { ordersService } from "@/services";
import type { PaginatedData, OrderReturn } from "@/types/domain";
import { formatPrice, formatDateTimeFa, toPersianDigits } from "@/utils/format";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "در انتظار", variant: "secondary" }, APPROVED: { label: "تأیید شده", variant: "default" },
  RECEIVED: { label: "دریافت شد", variant: "default" }, REFUNDED: { label: "بازگشت وجه", variant: "default" },
  REJECTED: { label: "رد شده", variant: "destructive" },
};

export default function AdminReturnsPage() {
  const [data, setData] = React.useState<PaginatedData<OrderReturn> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [reviewReturn, setReviewReturn] = React.useState<OrderReturn | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED" | null>(null);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [adminNote, setAdminNote] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    ordersService.adminReturns({ page, limit: 20 }).then((res) => {
      const d = res as any;
      setData(d.items ? d : { items: d, meta: { total: d.length, page: 1, limit: 20, totalPages: 1 } });
    }).finally(() => setLoading(false));
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    if (!reviewReturn || !reviewAction) return;
    if (reviewAction === "REFUNDED" && !refundAmount) { toast.error("مبلغ بازگشت وجه الزامی است"); return; }
    setProcessing(true);
    try {
      await ordersService.reviewReturn(reviewReturn.id, { status: reviewAction, refundAmount: refundAmount ? Number(refundAmount) : undefined, adminNote: adminNote || undefined });
      toast.success("عملیات انجام شد");
      setReviewReturn(null); setReviewAction(null); setRefundAmount(""); setAdminNote("");
      load();
    } catch { toast.error("عملیات ناموفق بود"); }
    finally { setProcessing(false); }
  };

  const openReview = (ret: OrderReturn, action: typeof reviewAction) => {
    setReviewReturn(ret); setReviewAction(action);
    setRefundAmount(ret.refundAmount?.toString() ?? ""); setAdminNote(ret.adminNote ?? "");
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-foreground sm:text-2xl">درخواست‌های مرجوعی</h1><p className="mt-1 text-sm text-muted-foreground">بررسی و پردازش مرجوعی‌ها</p></div>
      <AdminTable title=""
        columns={[
          { key: "id", header: "شناسه", render: (r) => <span className="font-mono text-xs" dir="ltr">{r.id.slice(-8)}</span> },
          { key: "reason", header: "دلیل", render: (r) => <span className="line-clamp-2 text-sm text-foreground">{r.reason}</span> },
          { key: "status", header: "وضعیت", render: (r) => { const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; } },
          { key: "amount", header: "مبلغ بازگشتی", hideOnMobile: true, align: "left", render: (r) => r.refundAmount ? <span className="nums-fa">{formatPrice(r.refundAmount)}</span> : "—" },
          { key: "date", header: "تاریخ", hideOnMobile: true, render: (r) => <span className="text-xs text-muted-foreground">{formatDateTimeFa(r.createdAt)}</span> },
          { key: "actions", header: "عملیات", align: "left", render: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.status === "PENDING" && (<>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-600" onClick={() => openReview(r, "APPROVED")}><Check className="size-3" />تأیید</Button>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600" onClick={() => openReview(r, "REJECTED")}><X className="size-3" />رد</Button>
              </>)}
              {r.status === "APPROVED" && <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openReview(r, "RECEIVED")}><RotateCcw className="size-3" />دریافت شد</Button>}
              {(r.status === "RECEIVED" || r.status === "APPROVED") && <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-600" onClick={() => openReview(r, "REFUNDED")}><DollarSign className="size-3" />بازگشت وجه</Button>}
            </div>
          )},
        ]}
        data={data?.items ?? []} isLoading={loading} getRowId={(r) => r.id} page={page} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total ?? 0} onPageChange={setPage} emptyTitle="درخواست مرجوعی وجود ندارد"
      />
      <AlertDialog open={!!reviewReturn} onOpenChange={(open) => !open && setReviewReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{reviewAction === "APPROVED" && "تأیید مرجوعی"}{reviewAction === "RECEIVED" && "تأیید دریافت کالا"}{reviewAction === "REFUNDED" && "بازگشت وجه به کیف پول"}{reviewAction === "REJECTED" && "رد مرجوعی"}</AlertDialogTitle>
            <AlertDialogDescription>{reviewReturn?.reason && <span className="block">دلیل: {reviewReturn.reason}</span>}{reviewAction === "REFUNDED" && "مبلغ به کیف پول کاربر واریز می‌شود."}{reviewAction === "RECEIVED" && "موجودی آیتم‌های مرجوعی به انبار برمی‌گردد."}{reviewAction === "REJECTED" && "سفارش به وضعیت تحویل‌شده برمی‌گردد."}</AlertDialogDescription>
          </AlertDialogHeader>
          {reviewAction === "REFUNDED" && <div className="space-y-2 py-2"><Label>مبلغ بازگشت (تومان) *</Label><Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} dir="ltr" /></div>}
          <div className="space-y-2 py-2"><Label>یادداشت ادمین (اختیاری)</Label><Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} /></div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleReview} disabled={processing} className={reviewAction === "REJECTED" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{processing ? <Loader2 className="size-4 animate-spin" /> : null}تأیید</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
