"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ArrowLeft,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { analyticsService, ordersService } from "@/services";
import type {
  AnalyticsOverview,
  AnalyticsSalesPoint,
  AnalyticsOrderStatusBreakdown,
  AnalyticsTopProduct,
  Order,
  OrderStatus,
} from "@/types/domain";
import { formatToman, formatPrice, toPersianDigits, formatDateTimeFa } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "در انتظار پرداخت", color: "bg-amber-500" },
  PROCESSING: { label: "در حال پردازش", color: "bg-blue-500" },
  SHIPPED: { label: "ارسال شده", color: "bg-indigo-500" },
  DELIVERED: { label: "تحویل شده", color: "bg-green-500" },
  CANCELLED: { label: "لغو شده", color: "bg-red-500" },
  RETURN_REQUESTED: { label: "درخواست مرجوعی", color: "bg-orange-500" },
  RETURNED: { label: "مرجوع شده", color: "bg-gray-500" },
  REFUNDED: { label: "بازگشت وجه", color: "bg-purple-500" },
  FAILED: { label: "ناموفق", color: "bg-red-700" },
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [sales, setSales] = React.useState<AnalyticsSalesPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = React.useState<AnalyticsOrderStatusBreakdown[]>([]);
  const [topProducts, setTopProducts] = React.useState<AnalyticsTopProduct[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      analyticsService.overview(),
      analyticsService.salesOverTime({ period: "day" }),
      analyticsService.orderStatusBreakdown(),
      analyticsService.topProducts({ limit: 5 }),
      ordersService.adminList({ limit: 5 }),
    ])
      .then(([ov, sl, sb, tp, ro]) => {
        setOverview(ov);
        setSales(sl);
        setStatusBreakdown(sb);
        setTopProducts(tp);
        const items = (ro as any).items ?? ro;
        setRecentOrders(Array.isArray(items) ? items : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="درآمد کل"
          value={overview ? formatToman(overview.totalRevenue) : "—"}
          icon={<DollarSign className="size-5" />}
          trend="total"
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950/30"
        />
        <KpiCard
          title="سفارش‌ها"
          value={overview ? toPersianDigits(overview.totalOrders) : "—"}
          icon={<ShoppingCart className="size-5" />}
          trend="total"
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
        />
        <KpiCard
          title="کاربران"
          value={overview ? toPersianDigits(overview.totalUsers) : "—"}
          icon={<Users className="size-5" />}
          trend="total"
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950/30"
        />
        <KpiCard
          title="محصولات"
          value={overview ? toPersianDigits(overview.totalProducts) : "—"}
          icon={<Package className="size-5" />}
          trend="total"
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-950/30"
        />
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">درآمد امروز</p>
              <p className="text-xl font-bold text-foreground nums-fa">
                {overview ? formatToman(overview.todayRevenue) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">سفارش‌های در انتظار</p>
              <p className="text-xl font-bold text-foreground nums-fa">
                {overview ? toPersianDigits(overview.pendingOrders) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">نمودار فروش</CardTitle>
            <CardDescription>درآمد در ۳۰ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <SalesChart data={sales} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                داده‌ای برای نمایش وجود ندارد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Order status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">وضعیت سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.filter((s) => s.count > 0).length > 0 ? (
              statusBreakdown
                .filter((s) => s.count > 0)
                .map((item) => {
                  const cfg = STATUS_LABELS[item.status] ?? STATUS_LABELS.PROCESSING;
                  const maxCount = Math.max(...statusBreakdown.map((s) => s.count), 1);
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cfg.label}</span>
                        <span className="font-medium nums-fa">{toPersianDigits(item.count)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", cfg.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                سفارشی موجود نیست
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">سفارش‌های اخیر</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/admin/orders">
                همه
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                سفارشی ثبت نشده
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">شماره</TableHead>
                    <TableHead className="text-xs">وضعیت</TableHead>
                    <TableHead className="text-left text-xs">مبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => {
                    const cfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.PROCESSING;
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-medium text-primary hover:underline"
                            dir="ltr"
                          >
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <span className={cn("size-1.5 rounded-full", cfg.color)} />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left text-xs font-medium nums-fa">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">پرفروش‌ترین محصولات</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                محصولی فروخته نشده
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary nums-fa">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground nums-fa">
                        {toPersianDigits(item.quantitySold)} فروش
                      </p>
                    </div>
                    <span className="text-sm font-medium nums-fa">
                      {formatPrice(item.revenue)}
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

/* ───────── KPI Card ───────── */

function KpiCard({
  title,
  value,
  icon,
  trend,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "total";
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex size-10 items-center justify-center rounded-lg", bgColor, color)}>
            {icon}
          </div>
          {trend === "up" && (
            <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <TrendingUp className="size-3" />
              +
            </Badge>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

/* ───────── Sales Chart (SVG-based) ───────── */

function SalesChart({ data }: { data: AnalyticsSalesPoint[] }) {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const minRevenue = 0;

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - ((d.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight,
    ...d,
  }));

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 400 }}
      >
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={padding.top + chartHeight * pct}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight * pct}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#salesGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ───────── Skeleton ───────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
