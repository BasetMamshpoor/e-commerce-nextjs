"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ticket as TicketIcon,
  Send,
  User as UserIcon,
  Headphones,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketsService } from "@/services";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته", variant: "outline" },
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "زیاد",
  URGENT: "فوری",
};

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    ticketsService.adminById(id).then(setTicket).finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

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
        <TicketIcon className="mx-auto mb-4 size-16 text-muted-foreground/40" />
        <p className="text-muted-foreground">تیکت پیدا نشد</p>
        <Button asChild className="mt-4">
          <Link href="/admin/tickets">بازگشت</Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_LABELS[ticket.status];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const updated = await ticketsService.adminAddMessage(ticket.id, { message: reply.trim() });
      setTicket(updated);
      setReply("");
    } catch {
      toast.error("ارسال ناموفق بود");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      const updated = await ticketsService.adminUpdate(ticket.id, { status });
      setTicket(updated);
      toast.success("وضعیت تغییر کرد");
    } catch {
      toast.error("عملیات ناموفق بود");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/tickets">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              <span>اولویت: {PRIORITY_LABELS[ticket.priority]}</span>
              {ticket.department && <span>بخش: {ticket.department.name}</span>}
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDateTimeFa(ticket.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">باز</SelectItem>
            <SelectItem value="ANSWERED">پاسخ داده شده</SelectItem>
            <SelectItem value="CLOSED">بسته</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversation */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {(ticket.messages ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">پیامی وجود ندارد</p>
          ) : (
            (ticket.messages ?? []).map((msg) => {
              const isUser = msg.senderType === "USER";
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      isUser ? "bg-primary/10 text-primary" : "bg-green-100 text-green-600",
                    )}
                  >
                    {isUser ? <UserIcon className="size-4" /> : <Headphones className="size-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-3",
                      isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    <p className={cn("mt-1 text-[10px]", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatDateTimeFa(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Reply */}
      <form onSubmit={handleSend} className="space-y-2">
        <Textarea
          placeholder="پاسخ به کاربر..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          disabled={sending}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">پاسخ شما به‌عنوان پشتیبانی ارسال می‌شود</p>
          <Button type="submit" disabled={sending || !reply.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            ارسال پاسخ
          </Button>
        </div>
      </form>
    </div>
  );
}
