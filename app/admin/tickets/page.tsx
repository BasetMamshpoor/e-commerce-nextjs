"use client";

import * as React from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/features/admin/components/admin-table";
import { ticketsService } from "@/services";
import type { PaginatedData, Ticket, TicketStatus } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

const STATUS_LABELS: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته", variant: "outline" },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "زیاد",
  URGENT: "فوری",
};

export default function AdminTicketsPage() {
  const [data, setData] = React.useState<PaginatedData<Ticket> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setLoading(true);
    ticketsService.adminList({ page, limit: 20 }).then(setData).finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminTable
      title="تیکت‌ها"
      description="مدیریت تیکت‌های پشتیبانی"
      columns={[
        {
          key: "subject",
          header: "موضوع",
          render: (t) => (
            <Link
              href={`/admin/tickets/${t.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {t.subject}
            </Link>
          ),
        },
        {
          key: "department",
          header: "بخش",
          render: (t) => t.department?.name ?? "—",
        },
        {
          key: "priority",
          header: "اولویت",
          render: (t) => (
            <span className={`text-xs ${t.priority === "URGENT" ? "text-destructive" : t.priority === "HIGH" ? "text-warning" : "text-muted-foreground"}`}>
              {PRIORITY_LABELS[t.priority]}
            </span>
          ),
        },
        {
          key: "status",
          header: "وضعیت",
          render: (t) => {
            const cfg = STATUS_LABELS[t.status];
            return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
          },
        },
        {
          key: "date",
          header: "تاریخ",
          render: (t) => (
            <span className="text-xs text-muted-foreground">{formatDateTimeFa(t.createdAt)}</span>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "left",
          render: (t) => (
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href={`/admin/tickets/${t.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          ),
        },
      ]}
      data={data?.items ?? []}
      isLoading={loading}
      getRowId={(t) => t.id}
      getRowHref={(t) => `/admin/tickets/${t.id}`}
      page={page}
      totalPages={data?.meta.totalPages ?? 1}
      total={data?.meta.total ?? 0}
      onPageChange={setPage}
      emptyTitle="تیکتی موجود نیست"
    />
  );
}
