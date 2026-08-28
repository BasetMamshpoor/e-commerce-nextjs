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
  const [exporting, setExporting] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    newsletterService
      .adminSubscribers({ page, limit: 20, search: search.trim() || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  const items = (data?.items ?? []) as NewsletterSubscriber[];

  const onExport = async () => {
    setExporting(true);
    try {
      // Export ALL matching subscribers (respecting the current search),
      // not just the currently-loaded page — the paginated list endpoint
      // is capped at 100 rows/page, so building the CSV from `items`
      // silently truncated the export to whatever page the admin happened
      // to be viewing.
      const all = await newsletterService.exportSubscribers(search.trim() || undefined);
      if (all.length === 0) {
        toast.error("موردی برای خروجی گرفتن وجود ندارد");
        return;
      }
      const csv = ["email,createdAt"];
      for (const s of all) {
        csv.push(`${s.email},${s.createdAt}`);
      }
      const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`خروجی CSV با ${toPersianDigits(all.length)} مشترک دانلود شد`);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "خروجی گرفتن ناموفق بود");
    } finally {
      setExporting(false);
    }
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
                } catch (e: unknown) {
                  const apiErr = e as { message?: string };
                  toast.error(apiErr?.message ?? "لغو عضویت ناموفق بود");
                }
              }}
              aria-label="لغو عضویت"
            >
              <Trash2 className="size-4" />
            </Button>
          ),
        },
      ]}
      data={items}
      isLoading={loading}
      getRowId={(s) => String(s.id)}
      page={page}
      totalPages={data?.meta?.totalPages ?? 1}
      total={data?.meta?.total ?? 0}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="جستجو در ایمیل‌ها..."
      headerActions={
        <Button variant="outline" size="sm" onClick={onExport} disabled={exporting || (data?.meta?.total ?? 0) === 0}>
          <Download className="size-4" />
          {exporting ? "در حال آماده‌سازی..." : "خروجی CSV"}
        </Button>
      }
      emptyTitle="هیچ مشترکی وجود ندارد"
      emptyDescription="هنوز کسی در خبرنامه عضو نشده است."
    />
  );
}
