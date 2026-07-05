"use client";

import * as React from "react";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Calendar,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import {
  useAnalyticsOverview,
  useAnalyticsSalesOverTime,
  useAnalyticsOrderStatus,
  useAnalyticsTopProducts,
  useAnalyticsNewUsers,
} from "@/features/admin/hooks";
import { formatPrice, formatToman, toPersianDigits, formatDateFa } from "@/utils/format";
import type { OrderStatus, AnalyticsPeriod } from "@/types/domain";

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
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

const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "#f59e0b",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  RETURN_REQUESTED: "#f97316",
  RETURNED: "#6b7280",
  REFUNDED: "#0891b2",
  FAILED: "#dc2626",
};

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("day");

  // Fix date range ONCE on mount. Using useState (not useMemo) ensures
  // the value never changes even if the component re-renders.
  // Without this, `new Date()` creates a new value each render →
  // new query key → refetch → re-render → infinite loop.
  const [dateRange] = React.useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    return { from: from.toISOString(), to: today.toISOString() };
  });

  // Build stable query objects with useMemo so React Query sees the same
  // reference and doesn't refetch.
  const salesQuery = React.useMemo(
    () => ({ ...dateRange, period }),
    [dateRange, period],
  );
  const newUsersQuery = React.useMemo(
    () => ({ ...dateRange, period }),
    [dateRange, period],
  );

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: sales, isLoading: salesLoading } = useAnalyticsSalesOverTime(salesQuery);
  const { data: statusBreakdown, isLoading: statusLoading } = useAnalyticsOrderStatus();
  const { data: topProducts, isLoading: topLoading } = useAnalyticsTopProducts({ limit: 10 });
  const { data: newUsers, isLoading: usersLoading } = useAnalyticsNewUsers(newUsersQuery);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <TrendingUp className="size-5 text-primary" />
            تحلیل و گزارش‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نماهای کلی فروش، سفارش‌ها، کاربران و محصولات پرفروش
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">روزانه</SelectItem>
            <SelectItem value="week">هفتگی</SelectItem>
            <SelectItem value="month">ماهانه</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="درآمد کل"
          value={overview ? formatToman(overview.totalRevenue) : undefined}
          icon={<TrendingUp className="size-5" />}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
          loading={overviewLoading}
        />
        <KpiCard
          title="سفارش‌های کل"
          value={overview ? toPersianDigits(overview.totalOrders) : undefined}
          icon={<ShoppingCart className="size-5" />}
          color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
          loading={overviewLoading}
        />
        <KpiCard
          title="کاربران کل"
          value={overview ? toPersianDigits(overview.totalUsers) : undefined}
          icon={<Users className="size-5" />}
          color="text-purple-600 bg-purple-50 dark:bg-purple-950/30"
          loading={overviewLoading}
        />
        <KpiCard
          title="محصولات کل"
          value={overview ? toPersianDigits(overview.totalProducts) : undefined}
          icon={<Package className="size-5" />}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
          loading={overviewLoading}
        />
      </div>

      {/* Today + Pending */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">درآمد امروز</p>
              {overviewLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <p className="text-sm font-bold nums-fa">
                  {overview ? formatToman(overview.todayRevenue) : "—"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">سفارش‌های امروز</p>
              {overviewLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <p className="text-sm font-bold nums-fa">
                  {overview ? toPersianDigits(overview.todayOrders) : "—"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/30">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">سفارش‌های در انتظار</p>
              {overviewLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <p className="text-sm font-bold nums-fa">
                  {overview ? toPersianDigits(overview.pendingOrders) : "—"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نمودار فروش</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : !sales || sales.length === 0 ? (
              <EmptyState title="داده‌ای موجود نیست" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={sales} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef3a4b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef3a4b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDateFa(v)}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v) => toPersianDigits(v >= 1000 ? `${Math.round(v / 1000)}هـ` : v)}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                    width={50}
                  />
                  <Tooltip
                    formatter={(v: unknown) => formatToman(Number(v))}
                    labelFormatter={(l) => formatDateFa(l as string)}
                    contentStyle={{
                      fontFamily: "Vazirmatn, sans-serif",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef3a4b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* New users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">کاربران جدید</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : !newUsers || newUsers.length === 0 ? (
              <EmptyState title="داده‌ای موجود نیست" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={newUsers} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDateFa(v)}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v) => toPersianDigits(v)}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                    width={30}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [toPersianDigits(Number(v)), "کاربر جدید"] as [string, string]}
                    labelFormatter={(l) => formatDateFa(l as string)}
                    contentStyle={{
                      fontFamily: "Vazirmatn, sans-serif",
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">وضعیت سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : !statusBreakdown || statusBreakdown.length === 0 ? (
              <EmptyState title="داده‌ای موجود نیست" className="py-8" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusBreakdown} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="status"
                      tickFormatter={(v) => ORDER_STATUS_LABEL[v as OrderStatus] ?? v}
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={(v) => toPersianDigits(v)}
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                      width={30}
                    />
                    <Tooltip
                      formatter={(v: unknown) => [toPersianDigits(Number(v)), "تعداد"] as [string, string]}
                      labelFormatter={(l) => ORDER_STATUS_LABEL[l as OrderStatus] ?? l}
                      contentStyle={{
                        fontFamily: "Vazirmatn, sans-serif",
                        fontSize: 12,
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusBreakdown.map((s) => (
                        <Cell key={s.status} fill={ORDER_STATUS_COLOR[s.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusBreakdown.map((s) => (
                    <Badge
                      key={s.status}
                      variant="outline"
                      className="gap-1.5"
                      style={{ borderColor: ORDER_STATUS_COLOR[s.status] }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: ORDER_STATUS_COLOR[s.status] }}
                      />
                      {ORDER_STATUS_LABEL[s.status] ?? s.status}: {toPersianDigits(s.count)}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-amber-500" />
              محصولات پرفروش
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !topProducts || topProducts.length === 0 ? (
              <EmptyState title="داده‌ای موجود نیست" className="py-8" />
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.product.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-2"
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30"
                        : idx === 1
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800"
                        : idx === 2
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {toPersianDigits(idx + 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground nums-fa">
                        {toPersianDigits(p.quantitySold)} فروش
                      </p>
                    </div>
                    <span className="text-xs font-bold text-success nums-fa">
                      {toPersianDigits(formatPrice(p.revenue))}
                      <span className="mr-1 font-normal text-muted-foreground">تومان</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-20" />
            ) : (
              <p className="mt-1 truncate text-lg font-bold text-foreground nums-fa">
                {value ?? "—"}
              </p>
            )}
          </div>
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
