"use client";

import * as React from "react";
import { Check, X, MessageSquare, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/features/admin/components/admin-table";
import { commentsService } from "@/services";
import type { CommentStatus, PaginatedData, Comment } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";

const STATUS_CONFIG: Record<CommentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار", variant: "secondary" },
  APPROVED: { label: "تأیید شده", variant: "default" },
  REJECTED: { label: "رد شده", variant: "destructive" },
};

export default function AdminCommentsPage() {
  const [data, setData] = React.useState<PaginatedData<Comment> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<CommentStatus | "">("");

  const load = React.useCallback(() => {
    setLoading(true);
    commentsService
      .adminList({ page, limit: 20, status: statusFilter || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: number) => {
    try {
      await commentsService.adminUpdate(id, { status: "APPROVED" });
      toast.success("نظر تأیید شد");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await commentsService.adminUpdate(id, { status: "REJECTED" });
      toast.success("نظر رد شد");
      load();
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  return (
    <div className="space-y-4">
      <AdminTable
        title="نظرات"
        description="مدیریت و تأیید نظرات کاربران"
        columns={[
          {
            key: "content",
            header: "نظر",
            render: (c) => (
              <div className="max-w-md">
                <p className="line-clamp-2 text-sm text-foreground">{c.content}</p>
                {c.rating && (
                  <p className="mt-1 text-xs text-warning nums-fa">★ {toPersianDigits(c.rating)}</p>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (c) => {
              const cfg = STATUS_CONFIG[c.status ?? "PENDING"];
              return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
            },
          },
          {
            key: "date",
            header: "تاریخ",
            render: (c) => (
              <span className="text-xs text-muted-foreground">{formatDateTimeFa(c.createdAt)}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "left",
            render: (c) => (
              <div className="flex gap-1">
                {c.status !== "APPROVED" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-success"
                    onClick={() => handleApprove(c.id)}
                  >
                    <Check className="size-4" />
                  </Button>
                )}
                {c.status !== "REJECTED" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleReject(c.id)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={data?.items ?? []}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="نظری موجود نیست"
      />

      {/* Status filter */}
      <div className="flex gap-2">
        {(["", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s === "" ? "همه" : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}
