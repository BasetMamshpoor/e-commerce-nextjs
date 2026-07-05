"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  Check,
  X,
  DollarSign,
  Package,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { ordersService } from "@/services";
import { formatPrice, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { OrderReturn, Order } from "@/types/domain";

const STATUS_CONFIG: Record<
  OrderReturn["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "در انتظار", variant: "secondary" },
  APPROVED: { label: "تأیید شده", variant: "default" },
  RECEIVED: { label: "دریافت شد", variant: "default" },
  REFUNDED: { label: "بازگشت وجه", variant: "default" },
  REJECTED: { label: "رد شده", variant: "destructive" },
};

interface ReturnDetail extends OrderReturn {
  order?: Order;
  images?: Array<{ id: number; url: string; originalName?: string }>;
  customerNote?: string | null;
  orderItem?: {
    id: number;
    productName: string;
    variantAttributes?: string;
    price: number;
    quantity: number;
  } | null;
}

export default function AdminReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = Number(params.id);

  const [detail, setDetail] = React.useState<ReturnDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reviewAction, setReviewAction] = React.useState<
    "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED" | null
  >(null);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [adminNote, setAdminNote] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    ordersService
      .adminReturnDetail(returnId)
      .then((d) => setDetail(d as ReturnDetail))
      .catch(() => toast.error("بارگذاری جزئیات مرجوعی ناموفق بود"))
      .finally(() => setLoading(false));
  }, [returnId]);

  React.useEffect(() => {
    if (!Number.isFinite(returnId)) return;
    load();
  }, [returnId, load]);

  const openReview = (action: typeof reviewAction) => {
    setReviewAction(action);
    setRefundAmount(detail?.refundAmount?.toString() ?? "");
    setAdminNote(detail?.adminNote ?? "");
  };

  const handleReview = async () => {
    if (!reviewAction) return;
    if (reviewAction === "REFUNDED" && !refundAmount) {
      toast.error("مبلغ بازگشت وجه الزامی است");
      return;
    }
    setProcessing(true);
    try {
      await ordersService.reviewReturn(returnId, {
        status: reviewAction,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        adminNote: adminNote || undefined,
      });
      toast.success("عملیات با موفقیت انجام شد");
      setReviewAction(null);
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon={<RotateCcw className="size-12" />}
        title="مرجوعی یافت نشد"
        description="این مرجوعی ممکن است حذف شده باشد یا شناسه نامعتبر است."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/orders/returns">بازگشت به لیست</Link>
          </Button>
        }
        className="py-16"
      />
    );
  }

  const order = detail.order;
  const cfg = STATUS_CONFIG[detail.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="space-y-5">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/admin" },
          { name: "سفارش‌ها", url: "/admin/orders" },
          { name: "مرجوعی‌ها", url: "/admin/orders/returns" },
          { name: `#${toPersianDigits(detail.id)}`, url: `/admin/orders/returns/${detail.id}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <RotateCcw className="size-5 text-primary" />
            مرجوعی #{toPersianDigits(detail.id)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ثبت شده در {formatDateTimeFa(detail.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant} className="text-sm">{cfg.label}</Badge>
          {order && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders/${order.id}`}>
                <Package className="size-4" />
                مشاهده سفارش
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: reason + customer note + images */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                دلیل مرجوعی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground">{detail.reason}</p>
            </CardContent>
          </Card>

          {detail.customerNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">یادداشت مشتری</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">{detail.customerNote}</p>
              </CardContent>
            </Card>
          )}

          {detail.images && detail.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4" />
                  تصاویر مرجوعی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {detail.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      { }
                      <img src={img.url} alt={img.originalName ?? "image"} className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order item */}
          {detail.orderItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="size-4" />
                  آیتم مرجوع شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Package className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {detail.orderItem.productName}
                    </p>
                    {detail.orderItem.variantAttributes && (
                      <p className="text-xs text-muted-foreground">
                        {detail.orderItem.variantAttributes}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground nums-fa">
                      تعداد: {toPersianDigits(detail.orderItem.quantity)} · قیمت:{" "}
                      {toPersianDigits(formatPrice(detail.orderItem.price))} تومان
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: order summary + actions */}
        <div className="space-y-4">
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اطلاعات سفارش</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="شماره سفارش" value={order.orderNumber} />
                <Row
                  label="وضعیت سفارش"
                  value={<Badge variant="outline">{order.status}</Badge>}
                />
                <Row
                  label="مبلغ کل سفارش"
                  value={
                    <span className="font-bold nums-fa">
                      {toPersianDigits(formatPrice(order.totalAmount))} تومان
                    </span>
                  }
                />
                <Row
                  label="تاریخ سفارش"
                  value={formatDateTimeFa(order.createdAt)}
                />
              </CardContent>
            </Card>
          )}

          {detail.refundAmount != null && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">مبلغ بازگشتی</p>
                <p className="mt-1 text-xl font-bold text-success nums-fa">
                  {toPersianDigits(formatPrice(detail.refundAmount))} تومان
                </p>
              </CardContent>
            </Card>
          )}

          {detail.adminNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">یادداشت ادمین</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">{detail.adminNote}</p>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {detail.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اقدامات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => openReview("APPROVED")}>
                  <Check className="size-4 text-success" />
                  تأیید مرجوعی
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => openReview("REJECTED")}>
                  <X className="size-4 text-destructive" />
                  رد مرجوعی
                </Button>
              </CardContent>
            </Card>
          )}

          {detail.status === "APPROVED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اقدامات بعدی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => openReview("RECEIVED")}>
                  <RotateCcw className="size-4" />
                  دریافت کالا در انبار
                </Button>
              </CardContent>
            </Card>
          )}

          {(detail.status === "RECEIVED" || detail.status === "APPROVED") && (
            <Card>
              <CardContent className="p-4">
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => openReview("REFUNDED")}
                >
                  <DollarSign className="size-4 text-success" />
                  بازگشت وجه به کیف پول
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review dialog */}
      <AlertDialog open={!!reviewAction} onOpenChange={(open) => !open && setReviewAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === "APPROVED" && "تأیید مرجوعی"}
              {reviewAction === "RECEIVED" && "تأیید دریافت کالا"}
              {reviewAction === "REFUNDED" && "بازگشت وجه به کیف پول"}
              {reviewAction === "REJECTED" && "رد مرجوعی"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === "REFUNDED" && "مبلغ به کیف پول کاربر واریز می‌شود."}
              {reviewAction === "RECEIVED" && "موجودی آیتم‌های مرجوعی به انبار برمی‌گردد."}
              {reviewAction === "REJECTED" && "سفارش به وضعیت تحویل‌شده برمی‌گردد."}
              {reviewAction === "APPROVED" && "مرجوعی تأیید می‌شود و در انتظار دریافت کالا قرار می‌گیرد."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reviewAction === "REFUNDED" && (
            <div className="space-y-2 py-2">
              <Label>مبلغ بازگشت (تومان) *</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>
          )}
          <div className="space-y-2 py-2">
            <Label>یادداشت ادمین (اختیاری)</Label>
            <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReview}
              disabled={processing}
              className={
                reviewAction === "REJECTED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {processing ? "در حال پردازش..." : "تأیید"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
