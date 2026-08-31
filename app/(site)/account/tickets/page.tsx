"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Ticket as TicketIcon, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { useTickets, useCreateTicket, useDepartments } from "@/features/tickets/hooks";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority } from "@/types/domain";

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

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "کم", NORMAL: "معمولی", HIGH: "زیاد", URGENT: "فوری",
};

export default function UserTicketsPage() {
  const [statusTab, setStatusTab] = React.useState<TicketStatus | "ALL">("ALL");
  // Same pagination bug as the orders list: this page never accepted a
  // `page` param or showed any pagination controls — useTickets defaults
  // to APP_CONFIG.defaultPageSize (20) per page, so a customer with more
  // than 20 tickets could never reach anything older than their most
  // recent 20.
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useTickets(statusTab === "ALL" ? { page } : { status: statusTab, page });
  const [createOpen, setCreateOpen] = React.useState(false);
  const { data: departments } = useDepartments();

  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { name: "خانه", url: "/" },
        { name: "حساب کاربری", url: "/account" },
        { name: "تیکت‌ها", url: "/account/tickets" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">تیکت‌های من</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> تیکت جدید
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setStatusTab(t.key);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-md px-4 py-2 text-xs font-medium transition-colors",
              statusTab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<TicketIcon className="size-12" />} title="تیکتی وجود ندارد" description="برای ارتباط با پشتیبانی، تیکت جدیدی ایجاد کنید." className="py-12" />
      ) : (
        <>
          <div className="space-y-2">
            {items.map((t) => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
              return (
                <Link key={t.id} href={`/account/tickets/${t.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-accent/30">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={cfg.variant} className="text-[9px]">{cfg.label}</Badge>
                        <span>اولویت: {PRIORITY_LABELS[t.priority]}</span>
                        {t.department && <span>بخش: {t.department.name}</span>}
                        <span className="flex items-center gap-0.5"><Clock className="size-3" />{formatDateTimeFa(t.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          )}
        </>
      )}

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} departments={departments ?? []} />
    </div>
  );
}

function CreateTicketDialog({ open, onOpenChange, departments }: {
  open: boolean; onOpenChange: (o: boolean) => void; departments: { id: number; name: string }[];
}) {
  const create = useCreateTicket();
  const [subject, setSubject] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState<number | "">("");
  const [priority, setPriority] = React.useState<TicketPriority>("NORMAL");
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setSubject(""); setDepartmentId(""); setPriority("NORMAL"); setMessage(""); setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const onSubmit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("موضوع و پیام الزامی است"); return; }
    create.mutate(
      { body: { subject: subject.trim(), departmentId: departmentId === "" ? undefined : Number(departmentId), priority, message: message.trim() }, files: files.length > 0 ? files : undefined },
      { onSuccess: () => { onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تیکت جدید</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>موضوع *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثال: مشکل در پرداخت" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>بخش پشتیبانی</Label>
              <Select value={departmentId === "" ? "" : String(departmentId)} onValueChange={(v) => setDepartmentId(v ? Number(v) : "")}>
                <SelectTrigger><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>اولویت</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>پیام *</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={message} onChange={(e) => setMessage(e.target.value)} placeholder="شرح مشکل یا سوال..." rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>فایل پیوست (اختیاری)</Label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files ?? []); setFiles((p) => [...p, ...f]); }} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Plus className="size-4" /> افزودن فایل</Button>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                    <span className="max-w-20 truncate">{f.name}</span>
                    <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={create.isPending || !subject.trim() || !message.trim()}>
            {create.isPending ? "در حال ارسال..." : "ارسال تیکت"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
