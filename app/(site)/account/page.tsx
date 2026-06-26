"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  Package,
  Ticket,
  Bell,
  ChevronLeft,
  TrendingUp,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { useUserMe, useWallet } from "@/features/account/hooks";
import { useOrders } from "@/features/checkout/hooks";
import { useNotifications } from "@/features/notifications/hooks";
import { useTickets } from "@/features/tickets/hooks";
import { formatToman, formatRelativeFa, toPersianDigits } from "@/utils/format";
import type { OrderStatus } from "@/types/domain";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
  RETURN_REQUESTED: "درخواست مرجوعی",
  RETURNED: "مرجوع شده",
  REFUNDED: "بازگشت وجه",
  FAILED: "ناموفق",
};

export default function AccountDashboardPage() {
  const { data: user, isLoading: userLoading } = useUserMe();
  const { data: wallet, isLoading: walletLoading } = useWallet(1, 3);
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: notifsData, isLoading: notifsLoading } = useNotifications({ limit: 3 });
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({ limit: 3 });

  const recentOrders = ordersData?.items ?? [];
  const recentNotifs = notifsData?.items ?? [];
  const recentTickets = ticketsData?.items ?? [];
  const recentTx = wallet?.transactions ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          سلام، {user?.fullName ?? "کاربر"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          خلاصه فعالیت‌های اخیر شما
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="size-5" />}
          label="موجودی کیف پول"
          value={walletLoading ? "..." : formatToman(wallet?.balance ?? 0)}
          href="/account/wallet"
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="سفارش‌ها"
          value={ordersLoading ? "..." : toPersianDigits(ordersData?.meta.total ?? 0)}
          href="/account/orders"
        />
        <StatCard
          icon={<Ticket className="size-5" />}
          label="تیکت‌ها"
          value={ticketsLoading ? "..." : toPersianDigits(ticketsData?.meta.total ?? 0)}
          href="/account/tickets"
        />
        <StatCard
          icon={<Bell className="size-5" />}
          label="نوتیفیکیشن‌های جدید"
          value={notifsLoading ? "..." : toPersianDigits(notifsData?.meta.total ?? 0)}
          href="/account/notifications"
        />
      </div>

      {/* Recent orders + tickets side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              سفارش‌های اخیر
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/account/orders">
                همه
                <ChevronLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                هنوز سفارشی ثبت نکرده‌اید
              </p>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium" dir="ltr">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeFa(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm font-medium nums-fa">
                      {toPersianDigits(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="size-4 text-primary" />
              تیکت‌های اخیر
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/account/tickets">
                همه
                <ChevronLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ticketsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : recentTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                تیکتی ثبت نکرده‌اید
              </p>
            ) : (
              recentTickets.slice(0, 3).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/account/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeFa(ticket.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      ticket.status === "OPEN"
                        ? "default"
                        : ticket.status === "ANSWERED"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {ticket.status === "OPEN"
                      ? "باز"
                      : ticket.status === "ANSWERED"
                        ? "پاسخ داده شده"
                        : "بسته"}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent notifications + transactions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              نوتیفیکیشن‌ها
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/account/notifications">
                همه
                <ChevronLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))
            ) : recentNotifs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                نوتیفیکیشنی وجود ندارد
              </p>
            ) : (
              recentNotifs.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeFa(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              تراکنش‌های کیف پول
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/account/wallet">
                همه
                <ChevronLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {walletLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))
            ) : recentTx.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                تراکنشی وجود ندارد
              </p>
            ) : (
              recentTx.slice(0, 3).map((tx) => {
                const isPositive =
                  tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ADMIN_ADJUST";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {tx.description ?? tx.type}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatRelativeFa(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium nums-fa ${
                        isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {toPersianDigits(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground nums-fa">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
