"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldBan, ShieldCheck, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminTable, StatusBadge } from "@/features/admin/components/admin-table";
import { usersAdminService } from "@/services";
import type { PaginatedData, User, UserRole } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  ADMIN: { label: "مدیر کل", color: "#ef3a4b" },
  EDITOR: { label: "ویرایشگر", color: "#3b82f6" },
  SUPPORT: { label: "پشتیبانی", color: "#f59e0b" },
  CUSTOMER: { label: "مشتری", color: "#6b7280" },
};

export default function AdminUsersPage() {
  const [data, setData] = React.useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    usersAdminService
      .list({ page, limit: 20, search: search || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <AdminTable
      title="کاربران"
      description="مدیریت کاربران سیستم"
      columns={[
        {
          key: "name",
          header: "نام",
          render: (u) => (
            <Link
              href={`/admin/users/${u.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {u.fullName}
            </Link>
          ),
        },
        {
          key: "email",
          header: "ایمیل/موبایل",
          render: (u) => (
            <span className="text-xs text-muted-foreground" dir="ltr">
              {u.email ?? u.phone ?? "—"}
            </span>
          ),
        },
        {
          key: "role",
          header: "نقش",
          render: (u) => {
            const cfg = ROLE_LABELS[u.role];
            return <StatusBadge status={u.role} label={cfg.label} color={cfg.color} />;
          },
        },
        {
          key: "status",
          header: "وضعیت",
          render: (u) => (
            <Badge variant={u.isBlocked ? "destructive" : "default"}>
              {u.isBlocked ? "مسدود" : "فعال"}
            </Badge>
          ),
        },
        {
          key: "joined",
          header: "تاریخ عضویت",
          render: (u) => (
            <span className="text-xs text-muted-foreground">
              {formatDateTimeFa(u.createdAt)}
            </span>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "left",
          render: (u) => (
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href={`/admin/users/${u.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          ),
        },
      ]}
      data={data?.items ?? []}
      isLoading={loading}
      getRowId={(u) => String(u.id)}
      getRowHref={(u) => `/admin/users/${u.id}`}
      page={page}
      totalPages={data?.meta.totalPages ?? 1}
      total={data?.meta.total ?? 0}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="جست‌وجو نام/ایمیل/موبایل..."
      emptyTitle="کاربری یافت نشد"
    />
  );
}
