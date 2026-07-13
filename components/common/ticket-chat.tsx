"use client";

import * as React from "react";
import { ArrowRight, Send, Paperclip, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { Ticket, TicketMessage } from "@/types/domain";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN: { label: "باز", variant: "default" },
  ANSWERED: { label: "پاسخ داده شده", variant: "secondary" },
  CLOSED: { label: "بسته شده", variant: "destructive" },
  PENDING_CUSTOMER: { label: "منتظر مشتری", variant: "outline" },
};

interface TicketChatProps {
  ticket: Ticket;
  /** "user" = user side, "admin" = admin side */
  mode: "user" | "admin";
  /** Send message function */
  onSendMessage: (message: string, files?: File[]) => Promise<Ticket>;
  /** Whether sending is in progress */
  sending: boolean;
  /** Whether the ticket is closed */
  isClosed: boolean;
  /** Header actions (admin: status changer, etc) */
  headerActions?: React.ReactNode;
}

/**
 * Unified ticket chat component for both user and admin.
 * - Fixed header at top with back button + ticket info
 * - Scrollable message area in middle
 * - Fixed textarea + attach button at bottom
 */
export function TicketChat({
  ticket, mode, onSendMessage, sending, isClosed, headerActions,
}: TicketChatProps) {
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [previewFile, setPreviewFile] = React.useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  const messages = ticket.messages ?? [];

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;
    await onSendMessage(message.trim() || "(فایل پیوست)", files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isMyMessage = (msg: TicketMessage) =>
    mode === "user" ? msg.senderType === "USER" : msg.senderType === "ADMIN";

  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header — fixed at top */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border p-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-foreground">{ticket.subject}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Badge variant={statusCfg.variant} className="text-[9px]">{statusCfg.label}</Badge>
            {ticket.priority && <span>اولویت: {ticket.priority}</span>}
            {ticket.department && <span>بخش: {ticket.department.name}</span>}
            <span>{formatDateTimeFa(ticket.createdAt)}</span>
          </div>
        </div>
        {headerActions}
      </div>

      {/* Messages — scrollable middle */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            پیامی وجود ندارد
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const mine = isMyMessage(msg);
              return (
                <div key={msg.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[75%] rounded-2xl p-3", mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    {/* Attachments — show as buttons, click to preview */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.attachments.map((att) => (
                          <button
                            key={att.id}
                            onClick={() => setPreviewFile({
                              url: att.media?.url ?? "",
                              name: att.media?.originalName ?? "فایل",
                              type: att.media?.mimeType ?? "",
                            })}
                            className={cn(
                              "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-colors",
                              mine ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" : "bg-background/50 text-foreground hover:bg-background",
                            )}
                          >
                            {att.media?.mimeType?.startsWith("image/") ? (
                              <ImageIcon className="size-3" />
                            ) : (
                              <FileText className="size-3" />
                            )}
                            {att.media?.originalName ?? "فایل پیوست"}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className={cn("mt-1 text-[9px]", mine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {formatDateTimeFa(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area — fixed at bottom */}
      {!isClosed && (
        <div className="shrink-0 border-t border-border p-3">
          {/* File chips */}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                  <span className="max-w-20 truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-destructive">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileSelected}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="size-4" />
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              rows={2}
              className="min-h-[40px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0"
              onClick={handleSend}
              disabled={sending || (!message.trim() && files.length === 0)}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      )}
      {isClosed && (
        <div className="shrink-0 border-t border-border p-4 text-center text-sm text-muted-foreground">
          این تیکت بسته شده است.
        </div>
      )}

      {/* File preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile?.type.startsWith("image/") ? (
             
            <img src={previewFile.url} alt={previewFile.name} className="w-full rounded-lg" />
          ) : previewFile?.type.startsWith("video/") ? (
            <video src={previewFile.url} controls className="w-full rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8">
              <FileText className="size-12 text-muted-foreground" />
              <a href={previewFile?.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                دانلود فایل
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
