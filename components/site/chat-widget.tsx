"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Bot, User, Headphones, Loader2 } from "lucide-react";
import { useChatEngine } from "@/hooks/use-chat-engine";
import { cn } from "@/lib/utils";
import { formatDateTimeFa } from "@/utils/format";

export function ChatWidget() {
  const { messages, connected, waitingForOperator, sendMessage, isOpen, setOpen, unreadCount } = useChatEngine();
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  // usePathname() is reactive to client-side navigation (unlike reading
  // window.location.pathname directly in the render body, which only
  // reflects the URL on whichever render happened to run last — the
  // widget could stay visible/hidden across a route change until some
  // unrelated state update happened to trigger a re-render).
  const pathname = usePathname();

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide on auth pages. (Admin routes live under app/admin, a separate
  // layout tree from app/(site) where this widget is mounted, so they
  // never reach this component at all — no check needed for them.)
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          aria-label="چت زنده"
        >
          <MessageCircle className="size-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground nums-fa">
              {unreadCount > 9 ? "۹+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary p-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="size-5" />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-primary",
                    connected ? "bg-green-400" : "bg-yellow-400",
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-medium">پشتیبانی آنلاین</p>
                <p className="text-[10px] opacity-80">
                  {connected ? "آنلاین" : "در حال اتصال..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-white/20"
              aria-label="بستن"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="mb-2 size-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">سلام! 👋</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  چه کمکی می‌تونم بکنم؟ سوالت رو بپرس.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {waitingForOperator && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                در انتظار پاسخ اپراتور...
              </div>
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
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="پیامت رو بنویس..."
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                disabled={!connected && messages.length === 0}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="ارسال"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChatBubble({ message }: { message: { senderType: string; content: string; createdAt?: string } }) {
  const isCustomer = message.senderType === "CUSTOMER";
  const isEngine = message.senderType === "ENGINE";
  const isOperator = message.senderType === "OPERATOR";
  const isSystem = message.senderType === "SYSTEM";

  if (isSystem) {
    return (
      <div className="text-center text-[11px] text-muted-foreground">
        {message.content}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", isCustomer ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
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

      {/* Bubble */}
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
        {message.createdAt && (
          <p className={cn("mt-1 text-[9px]", isCustomer ? "text-primary-foreground/60" : "text-muted-foreground")}>
            {formatDateTimeFa(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
