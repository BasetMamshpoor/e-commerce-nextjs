"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AuthGuard } from "@/components/common/auth-guard";
import {
  useOrderDetail,
  useCancelOrder,
  useRequestReturn,
  useInitiatePayment,
} from "@/features/checkout/hooks";
import { useWallet } from "@/features/account/hooks";
import { paymentGatewaysService } from "@/services";
import type { OrderStatus, PaymentGateway } from "@/types/domain";
import {
  formatToman,
  formatPrice,
  formatDateTimeFa,
  toPersianDigits,
} from "@/utils/format";

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_PAYMENT: { label: "در انتظار پرداخت", variant: "secondary" },
  PROCESSING: { label: "در حال پردازش", variant: "default" },
  SHIPPED: { label: "ارسال شده", variant: "default" },
  DELIVERED: { label: "تحویل شده", variant: "default" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
  RETURN_REQUESTED: { label: "درخواست مرجوعی", variant: "secondary" },
  RETURNED: { label: "مرجوع شده", variant: "destructive" },
  REFUNDED: { label: "بازگشت وجه", variant: "destructive" },
  FAILED: { label: "ناموفق", variant: "destructive" },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <AuthGuard>
      <OrderDetailContent id={Number(id)} />
    </AuthGuard>
  );
}

function OrderDetailContent({ id }: { id: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: order, isLoading } = useOrderDetail(id);
  const { data: wallet } = useWallet();
  const [gateways, setGateways] = React.useState<PaymentGateway[]>([]);

  React.useEffect(() => {
    paymentGatewaysService.list().then(setGateways).catch(() => {});
  }, []);

  // Show success/pending toasts on initial load (from checkout redirect).
  React.useEffect(() => {
    if (order && searchParams.get("success") === "1") {
      toast.success("سفارش شما با موفقیت ثبت شد");
      router.replace(`/account/orders/${id}`);
    } else if (order && searchParams.get("pending") === "1") {
      toast.info("سفارش ثبت شد — برای تکمیل پرداخت اقدام کنید");
      router.replace(`/account/orders/${id}`);
    }
  }, [order, searchParams, router, id]);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="container-site py-12">
        <EmptyState
          icon={<Package className="size-16" />}
          title="سفارش پیدا نشد"
          description="این سفارش وجود ندارد یا متعلق به شما نیست."
          action={
            <Button asChild>
              <Link href="/account/orders">سفارش‌های من</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PROCESSING;
  const canCancel =
    order.status === "PENDING_PAYMENT" || order.status === "PROCESSING";
  const canReturn = order.status === "DELIVERED";
  const needsPayment = order.status === "PENDING_PAYMENT";

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "سفارش‌های من", url: "/account/orders" },
          { name: order.orderNumber, url: `/account/orders/${id}` },
        ]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
            <span className="font-mono" dir="ltr">
              {order.orderNumber}
            </span>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ثبت: {formatDateTimeFa(order.createdAt)}
            {order.paidAt && (
              <>
                <span className="mx-2">•</span>
                پرداخت: {formatDateTimeFa(order.paidAt)}
              </>
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/account/orders">
            <ArrowRight className="size-4" />
            بازگشت به سفارش‌ها
          </Link>
        </Button>
      </div>

      {/* Pending payment banner */}
      {needsPayment && (
        <PendingPaymentBanner orderId={order.id} totalAmount={order.totalAmount} gateways={gateways} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Shipping info — tracking code + package number (when shipped) */}
          {(order.trackingCode || order.packageNumber) && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Truck className="size-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">اطلاعات ارسال</p>
                      <p className="text-sm font-medium text-foreground">
                        {order.shippingCompany?.name ?? "ارسال پستی"}
                      </p>
                    </div>
                  </div>
                  {order.trackingCode && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">کد رهگیری</p>
                      <p className="font-mono text-sm font-bold text-foreground nums-fa" dir="ltr">
                        {order.trackingCode}
                      </p>
                    </div>
                  )}
                  {order.packageNumber && (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">شماره بسته</p>
                      <p className="font-mono text-sm font-bold text-foreground nums-fa" dir="ltr">
                        {order.packageNumber}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-5 text-primary" />
                وضعیت سفارش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline history={order.statusHistory ?? []} currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-5 text-primary" />
                اقلام سفارش
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground nums-fa">
                      {toPersianDigits(item.quantity)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                      {item.variantAttributes && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {item.variantAttributes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    {item.discountAmount > 0 && (
                      <p className="text-xs text-success nums-fa">
                        تخفیف: {formatPrice(item.discountAmount)}
                      </p>
                    )}
                    <p className="font-medium nums-fa">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Returns */}
          {order.returns && order.returns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw className="size-5 text-primary" />
                  مرجوعی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="rounded-lg border border-border/60 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {ret.status === "PENDING" && "در انتظار بررسی"}
                        {ret.status === "APPROVED" && "تأیید شده"}
                        {ret.status === "RECEIVED" && "دریافت شد"}
                        {ret.status === "REFUNDED" && "بازگشت وجه"}
                        {ret.status === "REJECTED" && "رد شد"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTimeFa(ret.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{ret.reason}</p>
                    {ret.refundAmount && (
                      <p className="mt-1 text-success nums-fa">
                        مبلغ بازگشتی: {formatPrice(ret.refundAmount)}
                      </p>
                    )}
                    {ret.adminNote && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        یادداشت پشتیبانی: {ret.adminNote}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">جزئیات مالی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span className="nums-fa">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>تخفیف</span>
                  <span className="nums-fa">- {formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">هزینه ارسال</span>
                <span className="nums-fa">{formatPrice(order.shippingCost)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مالیات</span>
                  <span className="nums-fa">{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>مبلغ کل</span>
                <span className="nums-fa">{formatToman(order.totalAmount)}</span>
              </div>
              <div className="pt-2">
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="size-3" />
                  {order.paymentMethod === "WALLET"
                    ? "کیف پول"
                    : order.paymentMethod === "GATEWAY"
                      ? "درگاه بانکی"
                      : "ترکیبی"}
                </Badge>
                {order.discountCode && (
                  <Badge variant="outline" className="mr-2 gap-1">
                    <Tag className="size-3" />
                    {order.discountCode.code}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-5 text-primary" />
                ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.shippingCompany && (
                <div>
                  <p className="text-muted-foreground">شرکت حمل:</p>
                  <p className="font-medium text-foreground">
                    {order.shippingCompany.name}
                  </p>
                </div>
              )}
              <Separator />
              <div>
                <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  آدرس تحویل
                </p>
                {order.shippingAddress && (
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium text-foreground">
                      {order.shippingAddress.receiverName}
                    </p>
                    <p className="text-muted-foreground" dir="ltr">
                      {order.shippingAddress.receiverPhone}
                    </p>
                    <p className="text-muted-foreground">
                      {order.shippingAddress.fullAddress}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="space-y-2 p-4">
              {canCancel && <CancelOrderButton orderId={order.id} />}
              {canReturn && <ReturnRequestButton orderId={order.id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────── Sub-components ───────── */

function OrderTimeline({
  history,
  currentStatus,
}: {
  history: Array<{ status: OrderStatus; note?: string | null; createdAt: string }>;
  currentStatus: OrderStatus;
}) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground">تاریخچه‌ای ثبت نشده است.</p>;
  }
  // Reverse so newest is on top.
  const sorted = [...history].reverse();
  return (
    <ol className="relative space-y-4 pr-6">
      <span className="absolute bottom-2 right-2.5 top-2 w-px bg-border" />
      {sorted.map((entry, i) => {
        const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.PROCESSING;
        const isActive = entry.status === currentStatus && i === 0;
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -right-6 top-1 flex size-5 items-center justify-center rounded-full ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{cfg.label}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTimeFa(entry.createdAt)}
              </span>
            </div>
            {entry.note && (
              <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PendingPaymentBanner({
  orderId,
  totalAmount,
  gateways,
}: {
  orderId: number;
  totalAmount: number;
  gateways: PaymentGateway[];
}) {
  const initiate = useInitiatePayment();
  const [open, setOpen] = React.useState(false);
  const [selectedGateway, setSelectedGateway] = React.useState<string>("");

  React.useEffect(() => {
    if (gateways.length > 0 && !selectedGateway) {
      setSelectedGateway(gateways[0].slug);
    }
  }, [gateways, selectedGateway]);

  const onPay = () => {
    if (!selectedGateway) return;
    initiate.mutate({ id: orderId, gatewaySlug: selectedGateway });
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border-2 border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-foreground">
            این سفارش در انتظار پرداخت است
          </p>
          <p className="text-sm text-muted-foreground nums-fa">
            مبلغ باقیمانده: {formatPrice(totalAmount)} تومان
          </p>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="default" onClick={() => setOpen(true)}>
          <CreditCard className="size-4" />
          پرداخت الآن
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تکمیل پرداخت</DialogTitle>
            <DialogDescription>
              برای ادامه، درگاه پرداخت را انتخاب کنید. پس از پرداخت موفق، سفارش شما پردازش می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {gateways.map((g) => (
              <label
                key={g.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-3 hover:border-primary/40"
              >
                <input
                  type="radio"
                  name="gateway"
                  value={g.slug}
                  checked={selectedGateway === g.slug}
                  onChange={(e) => setSelectedGateway(e.target.value)}
                  className="size-4"
                />
                <span className="text-sm font-medium">{g.name}</span>
              </label>
            ))}
            {gateways.length === 0 && (
              <p className="text-sm text-muted-foreground">
                درگاه پرداختی در دسترس نیست.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button onClick={onPay} disabled={initiate.isPending || !selectedGateway || gateways.length === 0}>
              {initiate.isPending && <Loader2 className="size-4 animate-spin" />}
              ادامه به درگاه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CancelOrderButton({ orderId }: { orderId: number }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const cancel = useCancelOrder();

  const onConfirm = () => {
    if (!reason.trim()) {
      toast.error("دلیل لغو را وارد کنید");
      return;
    }
    cancel.mutate(
      { id: orderId, reason },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <XCircle className="size-4" />
        لغو سفارش
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو سفارش</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از لغو این سفارش مطمئن هستید؟ در صورت پرداخت، مبلغ به کیف پول شما بازمی‌گردد.
              این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              دلیل لغو
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="مثال: تغییر نظر، پیدا کردن گزینه بهتر..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={cancel.isPending || !reason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancel.isPending && <Loader2 className="size-4 animate-spin" />}
              تأیید لغو
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReturnRequestButton({ orderId }: { orderId: number }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const requestReturn = useRequestReturn();

  const onConfirm = () => {
    if (!reason.trim()) {
      toast.error("دلیل مرجوعی را وارد کنید");
      return;
    }
    requestReturn.mutate(
      { id: orderId, body: { reason } },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-4" />
        درخواست مرجوعی
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>درخواست مرجوعی</AlertDialogTitle>
            <AlertDialogDescription>
              درخواست شما برای بررسی به پشتیبانی ارسال می‌شود. در صورت تأیید، مبلغ به کیف پول شما بازمی‌گردد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="return-reason" className="text-sm font-medium">
              دلیل مرجوعی
            </Label>
            <Textarea
              id="return-reason"
              placeholder="مثال: کالا معیوب بود، سایز مناسب نبود..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={requestReturn.isPending || !reason.trim()}
            >
              {requestReturn.isPending && <Loader2 className="size-4 animate-spin" />}
              ارسال درخواست
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="container-site py-6">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-4 h-8 w-96" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
