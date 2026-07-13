"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Ticket as TicketIcon, ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ticketsService } from "@/services";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Ticket, TicketStatus, TicketPriority, TicketDepartment, PaginatedData } from "@/types/domain";

export const dynamic = "force-dynamic";

const STATUS_TABS: { key: TicketStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "همه" },
  { key: "OPEN", label: "باز" },
  { key: "ANSWERED", label: "پاسخ داده شده" },
  { key: "PENDING_CUSTOMER", label: "منتظر مشتری" },
  { key: "CLOSED", label: "بسته شده" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته شده", variant: "destructive" },
  PENDING_CUSTOMER: { label: "منتظر مشتری", variant: "outline" },
};

const PRIORITY_LABELS: Record<string, string> = { LOW: "کم", NORMAL: "معمولی", HIGH: "زیاد", URGENT: "فوری" };

export default function AdminTicketsPage() {
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get("userId");

  const [data, setData] = React.useState<PaginatedData<Ticket> | null>(null);
  const [departments, setDepartments] = React.useState<TicketDepartment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  const [statusTab, setStatusTab] = React.useState<TicketStatus | "ALL">("ALL");
  const [departmentId, setDepartmentId] = React.useState<string>("ALL");
  const [priority, setPriority] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (statusTab !== "ALL") params.status = statusTab;
    if (departmentId !== "ALL") params.departmentId = Number(departmentId);
    if (priority !== "ALL") params.priority = priority;
    if (search.trim()) params.search = search.trim();
    if (userIdFilter) params.userId = Number(userIdFilter);
    ticketsService.adminList(params).then(setData).catch(() => toast.error("بارگذاری ناموفق بود")).finally(() => setLoading(false));
  }, [page, statusTab, departmentId, priority, search, userIdFilter]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { ticketsService.departments().then(setDepartments).catch(() => {}); }, []);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <TicketIcon className="size-5 text-primary" /> تیکت‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت تیکت‌های پشتیبانی</p>
        </div>
        {userIdFilter && (
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tickets"><X className="size-4" /> حذف فیلتر کاربر</Link>
          </Button>
        )}
      </div>

      {/* User filter indicator */}
      {userIdFilter && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          فیلتر بر اساس کاربر: <span className="font-bold">#{userIdFilter}</span>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => { setStatusTab(t.key); setPage(1); }}
            className={cn("shrink-0 rounded-md px-4 py-2 text-xs font-medium transition-colors",
              statusTab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">بخش</label>
            <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">اولویت</label>
            <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">جستجو (موضوع / شماره)</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..." className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }} />
          </div>
        </CardContent>
      </Card>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<TicketIcon className="size-12" />} title="تیکتی یافت نشد" className="py-12" />
      ) : (
        <div className="space-y-2">
          {items.map((t) => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
            return (
              <Link key={t.id} href={`/admin/tickets/${t.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/30">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={cfg.variant} className="text-[9px]">{cfg.label}</Badge>
                        <span>اولویت: {PRIORITY_LABELS[t.priority] ?? t.priority}</span>
                        {t.department && <span>بخش: {t.department.name}</span>}
                        {t.user && <span>کاربر: {t.user.fullName}</span>}
                        <span>{formatDateTimeFa(t.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground nums-fa">مجموع: {toPersianDigits(data?.meta?.total ?? 0)}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4 rotate-180" /></Button>
            <span className="text-sm nums-fa">{toPersianDigits(page)} / {toPersianDigits(data?.meta?.totalPages ?? 1)}</span>
            <Button variant="outline" size="icon" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage(page + 1)}><ChevronLeft className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
