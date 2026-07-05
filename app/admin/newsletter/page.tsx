"use client";

import * as React from "react";
import { Mail, MailOpen, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { AdminTable } from "@/features/admin/components/admin-table";
import { newsletterService } from "@/services";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { NewsletterSubscriber, PaginatedData } from "@/types/domain";

export default function AdminNewsletterPage() {
  const [data, setData] = React.useState<PaginatedData<NewsletterSubscriber> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    newsletterService
      .adminSubscribers({ page, limit: 20 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  React.useEffect(() => {
    load();
  }, [load]);

  const items = (data?.items ?? []) as NewsletterSubscriber[];
  const filtered = search.trim()
    ? items.filter((s) => s.email.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const onExport = () => {
    const csv = ["email,createdAt"];
    for (const s of items) {
      csv.push(`${s.email},${s.createdAt}`);
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("خروجی CSV دانلود شد");
  };

  return (
    <AdminTable
      title="مشترکین خبرنامه"
      description="لیست ایمیل‌های عضو خبرنامه — امکان دانلود CSV"
      columns={[
        {
          key: "email",
          header: "ایمیل",
          render: (s) => (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <a
                href={`mailto:${s.email}`}
                className="font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {s.email}
              </a>
            </div>
          ),
        },
        {
          key: "createdAt",
          header: "تاریخ عضویت",
          render: (s) => (
            <span className="text-xs text-muted-foreground">{formatDateTimeFa(s.createdAt)}</span>
          ),
        },
        {
          key: "actions",
          header: "عملیات",
          align: "left",
          render: (s) => (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!confirm(`لغو عضویت ${s.email}؟`)) return;
                try {
                  await newsletterService.unsubscribe(s.email);
                  toast.success("عضویت لغو شد");
                  load();
                } catch {
                  toast.error("لغو عضویت ناموفق بود");
                }
              }}
              aria-label="لغو عضویت"
            >
              <Trash2 className="size-4" />
            </Button>
          ),
        },
      ]}
      data={filtered}
      isLoading={loading}
      getRowId={(s) => String(s.id)}
      page={page}
      totalPages={data?.meta?.totalPages ?? 1}
      total={data?.meta?.total ?? 0}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="جستجو در ایمیل‌ها..."
      headerActions={
        <Button variant="outline" size="sm" onClick={onExport} disabled={items.length === 0}>
          <Download className="size-4" />
          خروجی CSV
        </Button>
      }
      emptyTitle="هیچ مشترکی وجود ندارد"
      emptyDescription="هنوز کسی در خبرنامه عضو نشده است."
    />
  );
}
