"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ticket as TicketIcon,
  Plus,
  ChevronLeft,
  MessageSquare,
  Clock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { useTickets, useDepartments, useCreateTicket } from "@/features/tickets/hooks";
import { formatRelativeFa, formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { TicketPriority, TicketStatus } from "@/types/domain";

const STATUS_LABELS: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته شده", variant: "outline" },
};

const PRIORITY_LABELS: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: "کم", className: "text-muted-foreground" },
  NORMAL: { label: "معمولی", className: "text-info" },
  HIGH: { label: "زیاد", className: "text-warning" },
  URGENT: { label: "فوری", className: "text-destructive" },
};

export default function TicketsPage() {
  const { data, isLoading } = useTickets();
  const [createOpen, setCreateOpen] = React.useState(false);
  const tickets = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "تیکت‌ها", url: "/account/tickets" },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          تیکت‌های پشتیبانی
          {tickets.length > 0 && (
            <span className="mr-2 text-sm font-normal text-muted-foreground">
              ({toPersianDigits(tickets.length)} تیکت)
            </span>
          )}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          تیکت جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="size-16" />}
          title="تیکتی ثبت نکرده‌اید"
          description="اگر سوال یا مشکلی دارید، تیکت جدیدی ثبت کنید تا پشتیبانی پاسخ دهد."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              ثبت اولین تیکت
            </Button>
          }
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusCfg = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.OPEN;
            const prioCfg = PRIORITY_LABELS[ticket.priority] ?? PRIORITY_LABELS.NORMAL;
            return (
              <Link
                key={ticket.id}
                href={`/account/tickets/${ticket.id}`}
              >
                <Card className="border-border/60 transition-colors hover:border-primary/40 hover:bg-accent/30">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {ticket.subject}
                        </p>
                        <Badge variant={statusCfg.variant} className="shrink-0 text-xs">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        {ticket.department && <span>{ticket.department.name}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatRelativeFa(ticket.createdAt)}
                        </span>
                        <span className={prioCfg.className}>
                          اولویت: {prioCfg.label}
                        </span>
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

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateTicketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: departments } = useDepartments();
  const create = useCreateTicket();

  const [subject, setSubject] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState<number | "">("");
  const [priority, setPriority] = React.useState<TicketPriority>("NORMAL");
  const [message, setMessage] = React.useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    create.mutate(
      {
        subject,
        departmentId: departmentId === "" ? undefined : Number(departmentId),
        priority,
        message,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSubject("");
          setDepartmentId("");
          setPriority("NORMAL");
          setMessage("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تیکت جدید</DialogTitle>
          <DialogDescription>
            سوال یا مشکل خود را شرح دهید. پشتیبانی در اسرع وقت پاسخ خواهد داد.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="subject">موضوع</Label>
            <Input
              id="subject"
              placeholder="مثال: مشکل در پرداخت سفارش"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>بخش پشتیبانی</Label>
              <Select value={departmentId === "" ? "" : String(departmentId)} onValueChange={(v) => setDepartmentId(v ? Number(v) : "")}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب بخش" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">کم</SelectItem>
                  <SelectItem value="NORMAL">معمولی</SelectItem>
                  <SelectItem value="HIGH">زیاد</SelectItem>
                  <SelectItem value="URGENT">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">پیام</Label>
            <Textarea
              id="message"
              placeholder="شرح کامل مشکل یا سوال..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || !subject.trim() || !message.trim()}
            >
              {create.isPending ? "در حال ثبت..." : "ثبت تیکت"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
