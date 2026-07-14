"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingCart,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ordersService } from "@/services";
import type { Order, OrderStatus } from "@/types/domain";
import { formatPrice, formatToman, toPersianDigits, formatDateTimeFa } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "در انتظار پرداخت", color: "#f59e0b" },
  PROCESSING: { label: "در حال پردازش", color: "#3b82f6" },
  SHIPPED: { label: "ارسال شده", color: "#6366f1" },
  DELIVERED: { label: "تحویل شده", color: "#22c55e" },
  CANCELLED: { label: "لغو شده", color: "#ef4444" },
  RETURN_REQUESTED: { label: "درخواست مرجوعی", color: "#f97316" },
  RETURNED: { label: "مرجوع شده", color: "#6b7280" },
  REFUNDED: { label: "بازگشت وجه", color: "#a855f7" },
  FAILED: { label: "ناموفق", color: "#b91c1c" },
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  React.useEffect(() => {
    ordersService.adminById(Number(id)).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <ShoppingCart className="mx-auto mb-4 size-16 text-muted-foreground/40" />
        <p className="text-muted-foreground">سفارش پیدا نشد</p>
        <Button asChild className="mt-4">
          <Link href="/admin/orders">بازگشت</Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await ordersService.adminUpdateStatus(order.id, { status: newStatus });
      setOrder(updated);
      toast.success("وضعیت سفارش به‌روزرسانی شد");
    } catch {
      toast.error("به‌روزرسانی ناموفق بود");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/orders">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="font-mono" dir="ltr">{order.orderNumber}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
                {statusCfg.label}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTimeFa(order.createdAt)}
              {order.paidAt && <> • پرداخت: {formatDateTimeFa(order.paidAt)}</>}
            </p>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">تغییر وضعیت:</span>
          <Select value={order.status} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
            <SelectTrigger className="w-[180px]" disabled={updatingStatus}>
              {updatingStatus ? <Loader2 className="size-4 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                تاریخچه وضعیت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(order.statusHistory ?? []).slice().reverse().map((entry, i) => {
                  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.PROCESSING;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                      >
                        {entry.status === "DELIVERED" ? (
                          <CheckCircle2 className="size-4" />
                        ) : entry.status === "CANCELLED" ? (
                          <XCircle className="size-4" />
                        ) : (
                          <Package className="size-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                        {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTimeFa(entry.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4 text-primary" />
                اقلام سفارش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">محصول</TableHead>
                    <TableHead className="text-xs">ویژگی</TableHead>
                    <TableHead className="text-center text-xs">تعداد</TableHead>
                    <TableHead className="text-left text-xs">قیمت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground" dir="ltr">{item.variantAttributes}</TableCell>
                      <TableCell className="text-center text-sm nums-fa">{toPersianDigits(item.quantity)}</TableCell>
                      <TableCell className="text-left text-sm font-medium nums-fa">{formatPrice(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Financial */}
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
                <div className="flex justify-between text-green-600">
                  <span>تخفیف</span>
                  <span className="nums-fa">- {formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ارسال</span>
                <span className="nums-fa">{formatPrice(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>کل</span>
                <span className="nums-fa">{formatToman(order.totalAmount)}</span>
              </div>
              <div className="pt-2">
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="size-3" />
                  {order.paymentMethod === "WALLET"
                    ? "کیف پول"
                    : order.paymentMethod === "GATEWAY"
                      ? "درگاه"
                      : order.paymentMethod === "FREIGHT_COLLECT"
                        ? "پرداخت در محل"
                        : "ترکیبی"}
                </Badge>
                {order.discountCode && (
                  <Badge variant="outline" className="mr-2">{order.discountCode.code}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-primary" />
                ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.shippingCompany && (
                <div>
                  <p className="text-muted-foreground">شرکت حمل:</p>
                  <p className="font-medium">{order.shippingCompany.name}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  آدرس
                </p>
                {order.shippingAddress && (
                  <div className="space-y-0.5">
                    <p className="font-medium">{order.shippingAddress.receiverName}</p>
                    <p className="text-muted-foreground" dir="ltr">{order.shippingAddress.receiverPhone}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.fullAddress}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
