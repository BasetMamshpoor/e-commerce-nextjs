"use client";

import * as React from "react";
import {
  Bot,
  Headphones,
  Loader2,
  MessageCircle,
  Send,
  User,
  XCircle,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/empty-state";
import { useOperatorChat } from "@/hooks/use-operator-chat";
import { chatService, type OperatorChatMessage, type OperatorQueueConversation } from "@/services/chat.service";
import { getAccessToken } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDateTimeFa } from "@/utils/format";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEEDS_OPERATOR: { label: "منتظر اپراتور", variant: "destructive" },
  WITH_OPERATOR: { label: "در حال پاسخگویی", variant: "default" },
  AI_HANDLING: { label: "ربات", variant: "secondary" },
  OPEN: { label: "باز", variant: "outline" },
  CLOSED: { label: "بسته", variant: "outline" },
};

const CHANNEL_LABELS: Record<string, string> = {
  WEBSITE: "وب‌سایت",
  TELEGRAM: "تلگرام",
  INSTAGRAM: "اینستاگرام",
  WHATSAPP: "واتساپ",
  BALE: "بله",
};

const QUEUE_TABS = [
  { key: "ALL" as const, label: "صف فعال" },
  { key: "NEEDS_OPERATOR" as const, label: "منتظر اپراتور" },
  { key: "WITH_OPERATOR" as const, label: "در حال پاسخگویی" },
  { key: "CLOSED" as const, label: "بسته‌شده‌ها" },
];

function getCustomerLabel(conversation: OperatorQueueConversation): string {
  const customer = conversation.customer;
  if (customer?.displayName) return customer.displayName;
  if (customer?.storeUserId) return `کاربر #${customer.storeUserId}`;
  if (customer?.externalId) return `مهمان ${String(customer.externalId).slice(0, 8)}...`;
  if (customer?.guestToken) return `مهمان ${customer.guestToken.slice(0, 8)}...`;
  return "مشتری ناشناس";
}

export function LiveChatConsole() {
  const {
    queue,
    messages,
    selectedId,
    setSelectedId,
    queueFilter,
    setQueueFilter,
    connected,
    loadingQueue,
    loadingMessages,
    sending,
    sendReply,
    closeConversation,
    releaseConversation,
    deleteConversation,
  } = useOperatorChat();

  const [input, setInput] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState<string>("ALL");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const selectedConversation = queue.find((c) => c.id === selectedId) ?? null;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendReply(text);
  };

  // Filter queue by channel locally (REST filter could also be added)
  const filteredQueue = channelFilter === "ALL"
    ? queue
    : queue.filter((c) => c.channel === channelFilter);

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Queue panel */}
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card lg:w-80 xl:w-96">
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">صف مکالمه‌ها</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span
                className={cn(
                  "size-2 rounded-full",
                  connected ? "bg-green-500" : "bg-yellow-500",
                )}
              />
              {connected ? "آنلاین" : "در حال اتصال..."}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-2 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
            {QUEUE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setQueueFilter(tab.key)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                  queueFilter === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Channel filter */}
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="mt-2 h-8 text-xs">
              <SelectValue placeholder="همه کانال‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">همه کانال‌ها</SelectItem>
              <SelectItem value="WEBSITE">وب‌سایت</SelectItem>
              <SelectItem value="TELEGRAM">تلگرام</SelectItem>
              <SelectItem value="INSTAGRAM">اینستاگرام</SelectItem>
              <SelectItem value="WHATSAPP">واتساپ</SelectItem>
              <SelectItem value="BALE">بله</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingQueue ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="size-10" />}
              title="مکالمه‌ای در صف نیست"
              description="وقتی مشتری به اپراتور ارجاع داده شود اینجا نمایش داده می‌شود."
              className="py-10"
            />
          ) : (
            <div className="space-y-1">
              {filteredQueue.map((conversation) => {
                const statusCfg = STATUS_LABELS[conversation.status] ?? STATUS_LABELS.OPEN;
                const active = selectedId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-right transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-accent/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{getCustomerLabel(conversation)}</p>
                      <Badge variant={statusCfg.variant} className="shrink-0 text-[9px]">
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {CHANNEL_LABELS[conversation.channel] ?? conversation.channel}
                      {" · "}
                      {formatDateTimeFa(conversation.lastMessageAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversation panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {!selectedConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <Headphones className="mb-3 size-12 text-muted-foreground" />
            <p className="text-sm font-medium">یک مکالمه را انتخاب کنید</p>
            <p className="mt-1 text-xs text-muted-foreground">
              مشتریانی که در ویجت چت به اپراتور ارجاع شده‌اند اینجا نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <>
            {/* Header with management actions */}
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{getCustomerLabel(selectedConversation)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {CHANNEL_LABELS[selectedConversation.channel] ?? selectedConversation.channel}
                  {selectedConversation.customer?.storeUserId
                    ? ` · کاربر #${selectedConversation.customer.storeUserId}`
                    : null}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {/* Management dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      مدیریت
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={releaseConversation} className="gap-2 text-xs">
                      <Unlock className="size-3.5" />
                      آزاد کن (برگشت به ربات)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={closeConversation} className="gap-2 text-xs">
                      <XCircle className="size-3.5" />
                      بستن مکالمه
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("این مکالمه و تمام پیام‌های آن حذف می‌شود. مطمئن هستید؟")) {
                          deleteConversation();
                        }
                      }}
                      className="gap-2 text-xs text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      حذف کامل
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {loadingMessages && messages.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">پیامی وجود ندارد</p>
              ) : (
                messages.map((msg) => <OperatorMessageBubble key={msg.id} message={msg} conversationId={selectedConversation.id} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="پاسخ خود را بنویسید..."
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  disabled={sending}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  aria-label="ارسال"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── Telegram media loader hook ───────── */

function useTelegramMedia(conversationId: string, messageId: string | undefined) {
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!messageId) return;
    setLoading(true);
    try {
      const token = getAccessToken();
      const url = chatService.getOperatorMediaUrl(conversationId, messageId);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch media");
      const blob = await res.blob();
      setMediaUrl(URL.createObjectURL(blob));
    } catch {
      setMediaUrl(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId, messageId]);

  React.useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  return { mediaUrl, loading, load };
}

/* ───────── Message bubble with Telegram media support ───────── */

function OperatorMessageBubble({ message, conversationId }: { message: OperatorChatMessage; conversationId: string }) {
  const isCustomer = message.senderType === "CUSTOMER";
  const isOperator = message.senderType === "OPERATOR";
  const isEngine = message.senderType === "ENGINE";
  const isSystem = message.senderType === "SYSTEM";

  // Check for Telegram media (photo/voice)
  const telegramFileId = (message.metadata as { telegramFileId?: string } | null)?.telegramFileId;
  const { mediaUrl, loading, load } = useTelegramMedia(
    conversationId,
    telegramFileId ? message.id : undefined,
  );

  if (isSystem) {
    return (
      <div className="text-center text-[11px] text-muted-foreground">{message.content}</div>
    );
  }

  return (
    <div className={cn("flex gap-2", isCustomer ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isCustomer
            ? "bg-primary text-primary-foreground"
            : isOperator
              ? "bg-blue-500 text-white"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isCustomer ? (
          <User className="size-3.5" />
        ) : isOperator ? (
          <Headphones className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          isCustomer
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : isOperator
              ? "rounded-tl-sm bg-blue-500/10 text-foreground"
              : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Telegram media (photo/voice) */}
        {telegramFileId && (
          <div className="mt-2">
            {mediaUrl ? (
              // Heuristic: if content-type starts with image, show img; else audio
              <img src={mediaUrl} alt="رسانه تلگرام" className="max-w-full rounded-lg" />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
                className="gap-1.5 text-xs"
              >
                {loading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ImageIcon className="size-3" />
                )}
                نمایش رسانه
              </Button>
            )}
          </div>
        )}

        <p
          className={cn(
            "mt-1 text-[9px]",
            isCustomer ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          {formatDateTimeFa(message.createdAt)}
          {isEngine && message.layer ? ` · ${message.layer}` : ""}
        </p>
      </div>
    </div>
  );
}
