"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Send,
  User as UserIcon,
  Headphones,
  Clock,
  Loader2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { useTicketDetail, useAddTicketMessage } from "@/features/tickets/hooks";
import { formatDateTimeFa, formatRelativeFa } from "@/utils/format";
import type { TicketPriority, TicketStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته شده", variant: "outline" },
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "زیاد",
  URGENT: "فوری",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const numericId = Number(id);
  const { data: ticket, isLoading } = useTicketDetail(numericId);
  const addMessage = useAddTicketMessage();
  const [reply, setReply] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages.
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  if (isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) {
    return (
      <EmptyState
        icon={<Headphones className="size-16" />}
        title="تیکت پیدا نشد"
        description="این تیکت وجود ندارد یا متعلق به شما نیست."
        action={
          <Button asChild>
            <Link href="/account/tickets">بازگشت به تیکت‌ها</Link>
          </Button>
        }
      />
    );
  }

  const statusCfg = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.OPEN;
  const isClosed = ticket.status === "CLOSED";

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() && files.length === 0) return;
    addMessage.mutate(
      {
        id: numericId,
        body: { message: reply.trim() || "(فایل پیوست)" },
        files: files.length > 0 ? files : undefined,
      },
      {
        onSuccess: () => {
          setReply("");
          setFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: () => {
          // Keep the reply text so user can retry.
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "حساب کاربری", url: "/account" },
          { name: "تیکت‌ها", url: "/account/tickets" },
          { name: ticket.subject, url: `/account/tickets/${id}` },
        ]}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
              aria-label="بازگشت"
            >
              <ArrowRight className="size-5" />
            </button>
            <span className="truncate">{ticket.subject}</span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            <span>اولویت: {PRIORITY_LABELS[ticket.priority]}</span>
            {ticket.department && <span>بخش: {ticket.department.name}</span>}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatRelativeFa(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {(ticket.messages ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              پیامی وجود ندارد
            </p>
          ) : (
            (ticket.messages ?? []).map((msg) => {
              const isUser = msg.senderType === "USER";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isUser ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      isUser
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isUser ? <UserIcon className="size-4" /> : <Headphones className="size-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-3",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att) => {
                          const isImage = att.media?.mimeType?.startsWith("image/");
                          return (
                            <a
                              key={att.id}
                              href={att.media?.url}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "flex items-center gap-2 rounded-lg p-1.5 text-xs transition-colors",
                                isUser
                                  ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                                  : "bg-background/50 text-foreground hover:bg-background",
                              )}
                            >
                              {isImage ? (
                                <img
                                  src={att.media?.url}
                                  alt={att.media?.originalName ?? "image"}
                                  className="size-8 rounded object-cover"
                                />
                              ) : (
                                <Paperclip className="size-4 shrink-0" />
                              )}
                              <span className="truncate">{att.media?.originalName ?? "فایل"}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isUser ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
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

      {/* Reply box */}
      {isClosed ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          این تیکت بسته شده است. برای ادامه، تیکت جدیدی ثبت کنید.
        </div>
      ) : (
        <form onSubmit={onSend} className="space-y-2">
          <Textarea
            placeholder="پاسخ خود را بنویسید..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            disabled={addMessage.isPending}
          />
          {/* File attachment */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...newFiles]);
              }}
              className="hidden"
              id="ticket-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={addMessage.isPending}
            >
              <Paperclip className="size-4" />
              پیوست
            </Button>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                  >
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-destructive hover:text-destructive/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              پاسخ شما پس از ارسال، تیکت دوباره باز می‌شود
            </p>
            <Button
              type="submit"
              disabled={addMessage.isPending || (!reply.trim() && files.length === 0)}
            >
              {addMessage.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              ارسال پاسخ
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
