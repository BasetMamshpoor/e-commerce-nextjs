"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ChevronLeft, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AuthGuard } from "@/components/common/auth-guard";
import { useOrders } from "@/features/checkout/hooks";
import { formatToman, formatPrice, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

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

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}

function OrdersContent() {
  const { data, isLoading } = useOrders();
  const orders = data?.items ?? [];

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "سفارش‌های من", url: "/account/orders" },
        ]}
      />

      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        سفارش‌های من
        {orders.length > 0 && (
          <span className="mr-2 text-sm font-normal text-muted-foreground">
            ({toPersianDigits(orders.length)} سفارش)
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-16" />}
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="سفارش‌های شما پس از خرید در این صفحه نمایش داده می‌شوند."
          action={
            <Button asChild>
              <Link href="/products">شروع خرید</Link>
            </Button>
          }
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderListItem key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderListItem({ order }: { order: Order }) {
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PROCESSING;
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const firstItem = order.items[0];
  const extraItems = order.items.length - 1;

  return (
    <Card className="overflow-hidden border-border/60 transition-colors hover:border-primary/40">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground" dir="ltr">
                {order.orderNumber}
              </span>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTimeFa(order.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              {firstItem?.productName}
              {extraItems > 0 && (
                <span className="mr-1 text-xs">و {toPersianDigits(extraItems)} کالای دیگر</span>
              )}
              <span className="mx-2">•</span>
              {toPersianDigits(itemCount)} کالا
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-xs text-muted-foreground">مبلغ کل</p>
              <p className="font-bold text-foreground nums-fa">
                {formatPrice(order.totalAmount)}
                <span className="mr-1 text-xs font-normal">تومان</span>
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders/${order.id}`}>
                <Eye className="size-4" />
                مشاهده
                <ChevronLeft className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
