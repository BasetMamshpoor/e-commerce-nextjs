"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { AdminTable, StatusBadge } from "@/features/admin/components/admin-table";
import { ordersService } from "@/services";
import type { PaginatedData, Order, OrderStatus } from "@/types/domain";
import { formatPrice, toPersianDigits, formatDateTimeFa } from "@/utils/format";

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

const STATUS_FILTERS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
];

export default function AdminOrdersPage() {
  const [data, setData] = React.useState<PaginatedData<Order> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "">("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    ordersService
      .adminList({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  const orders = data?.items ?? [];

  return (
    <div className="space-y-4">
      <AdminTable
        title="سفارش‌ها"
        description="مدیریت سفارش‌های فروشگاه"
        columns={[
          {
            key: "orderNumber",
            header: "شماره سفارش",
            render: (o) => (
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-mono text-xs font-medium text-primary hover:underline"
                dir="ltr"
              >
                {o.orderNumber}
              </Link>
            ),
          },
          {
            key: "customer",
            header: "مشتری",
            render: (o) => {
              const u = (o as any).user;
              return (
                <span className="text-sm">{u?.fullName ?? "—"}</span>
              );
            },
          },
          {
            key: "status",
            header: "وضعیت",
            render: (o) => {
              const cfg = STATUS_CONFIG[o.status];
              return <StatusBadge status={o.status} label={cfg.label} color={cfg.color} />;
            },
          },
          {
            key: "total",
            header: "مبلغ",
            align: "left",
            render: (o) => (
              <span className="font-medium nums-fa">
                {formatPrice(o.totalAmount)}
              </span>
            ),
          },
          {
            key: "items",
            header: "اقلام",
            align: "center",
            render: (o) => (
              <span className="text-xs text-muted-foreground nums-fa">
                {toPersianDigits(o.items.length)}
              </span>
            ),
          },
          {
            key: "date",
            header: "تاریخ",
            render: (o) => (
              <span className="text-xs text-muted-foreground">
                {formatDateTimeFa(o.createdAt)}
              </span>
            ),
          },
        ]}
        data={orders}
        isLoading={loading}
        getRowId={(o) => o.id}
        getRowHref={(o) => `/admin/orders/${o.id}`}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="جست‌وجو شماره سفارش..."
        emptyTitle="سفارشی یافت نشد"
      />

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStatusFilter("");
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            statusFilter === ""
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          همه
        </button>
        {STATUS_FILTERS.map((status) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
