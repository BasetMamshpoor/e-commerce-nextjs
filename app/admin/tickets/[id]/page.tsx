"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChat } from "@/components/common/ticket-chat";
import { ticketsService } from "@/services";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/domain";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "باز" },
  { value: "ANSWERED", label: "پاسخ داده شده" },
  { value: "PENDING_CUSTOMER", label: "منتظر مشتری" },
  { value: "CLOSED", label: "بسته شده" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "کم" },
  { value: "NORMAL", label: "معمولی" },
  { value: "HIGH", label: "زیاد" },
  { value: "URGENT", label: "فوری" },
];

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const numericId = Number(id);
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    ticketsService.adminById(numericId)
      .then(setTicket)
      .catch(() => toast.error("بارگذاری تیکت ناموفق بود"))
      .finally(() => setLoading(false));
  }, [numericId]);

  React.useEffect(() => { load(); }, [load]);

  const handleSend = async (message: string, files?: File[]): Promise<Ticket> => {
    setSending(true);
    try {
      // Return the actual API response, not the (stale, pre-refetch) closed-
      // over `ticket` state — TicketChat doesn't currently use this return
      // value, but the customer-facing ticket page's equivalent handler
      // does return the real response, and this should behave the same way
      // rather than silently returning wrong data if a future caller starts
      // relying on it.
      const updated =
        files && files.length > 0
          ? await ticketsService.adminAddMessageWithAttachments(numericId, { message }, files)
          : await ticketsService.adminAddMessage(numericId, { message });
      // Backend returns empty messages — must refetch for the full thread.
      await load();
      return updated;
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await ticketsService.adminUpdate(numericId, { status });
      toast.success("وضعیت تغییر کرد");
      await load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "تغییر وضعیت ناموفق بود");
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    try {
      await ticketsService.adminUpdate(numericId, { priority });
      toast.success("اولویت تغییر کرد");
      await load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "تغییر اولویت ناموفق بود");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">تیکت پیدا نشد.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>بازگشت</Button>
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED";

  return (
    <TicketChat
      ticket={ticket}
      mode="admin"
      onSendMessage={handleSend}
      sending={sending}
      isClosed={isClosed}
      headerActions={
        <div className="flex items-center gap-2">
          <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ticket.priority} onValueChange={(v) => handlePriorityChange(v as TicketPriority)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      }
    />
  );
}
