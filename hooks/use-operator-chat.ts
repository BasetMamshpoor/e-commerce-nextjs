"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

import {
  chatService,
  type OperatorChatMessage,
  type OperatorQueueConversation,
  type OperatorQueueQuery,
} from "@/services/chat.service";
import { getAccessToken } from "@/lib/api-client";

/** Play a short notification beep using Web Audio API (no external file needed). */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext not available — silent fallback.
  }
}

/** Quick inline customer label for toast notifications. */
function getCustomerLabelInline(c: OperatorQueueConversation): string {
  if (c.customer?.displayName) return c.customer.displayName;
  if (c.customer?.storeUserId) return `کاربر #${c.customer.storeUserId}`;
  if (c.customer?.externalId) return `مهمان ${String(c.customer.externalId).slice(0, 8)}`;
  return "مشتری";
}

type QueueFilter = "ALL" | "NEEDS_OPERATOR" | "WITH_OPERATOR" | "CLOSED" | "AI_HANDLING" | "OPEN";

export interface UseOperatorChatReturn {
  queue: OperatorQueueConversation[];
  messages: OperatorChatMessage[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  queueFilter: QueueFilter;
  setQueueFilter: (filter: QueueFilter) => void;
  connected: boolean;
  loadingQueue: boolean;
  loadingMessages: boolean;
  sending: boolean;
  refreshQueue: () => Promise<void>;
  sendReply: (text: string) => Promise<void>;
  closeConversation: () => Promise<void>;
  releaseConversation: () => Promise<void>;
  deleteConversation: () => Promise<void>;
}

export function useOperatorChat(): UseOperatorChatReturn {
  const { data: session } = useSession();
  const accessToken =
    (session as { accessToken?: string } | null)?.accessToken ?? getAccessToken();

  const [queue, setQueue] = useState<OperatorQueueConversation[]>([]);
  const [messages, setMessages] = useState<OperatorChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ALL");
  const [connected, setConnected] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Initial queue load via REST — after this, Socket.io handles all updates.
  const refreshQueue = useCallback(async () => {
    try {
      const status = queueFilter === "ALL" ? undefined : (queueFilter as OperatorQueueQuery["status"]);
      const data = await chatService.getOperatorQueue(status ? { status } : undefined);
      setQueue(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "بارگذاری صف ناموفق بود";
      toast.error(message);
    } finally {
      setLoadingQueue(false);
    }
  }, [queueFilter]);

  // Load messages for a conversation via REST (one-time on select).
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await chatService.getOperatorConversation(conversationId);
      setMessages(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "بارگذاری پیام‌ها ناموفق بود";
      toast.error(message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load when filter changes
  useEffect(() => {
    setLoadingQueue(true);
    refreshQueue();
  }, [refreshQueue]);

  // Load messages when a conversation is selected — NO interval/polling.
  // New messages arrive via Socket.io queue:update (which patches the queue)
  // and we re-fetch messages only when a queue:update targets the selected conversation.
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  // Socket.io connection — all real-time updates come through here.
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${chatService.wsBase}/operator`, {
      auth: { token: accessToken },
      query: { tenantKey: "default" },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // queue:new — a new conversation entered the queue.
    // Add it to the top of the local list (no full refresh).
    // Also play a notification sound + show a toast.
    socket.on("queue:new", (item: OperatorQueueConversation) => {
      setQueue((prev) => {
        if (prev.some((c) => c.id === item.id)) return prev;
        return [item, ...prev];
      });
      // Notification: sound + toast
      playNotificationSound();
      toast.info("💬 مکالمه جدید در صف", {
        description: `${getCustomerLabelInline(item)} — ${item.channel}`,
      });
    });

    // queue:update — an existing conversation changed (new customer message,
    // another operator replied, status changed). Patch the local item.
    socket.on("queue:update", (item: OperatorQueueConversation) => {
      setQueue((prev) => {
        const idx = prev.findIndex((c) => c.id === item.id);
        if (idx === -1) {
          // Not in list yet — add it (might match current filter)
          return [item, ...prev];
        }
        // Replace in-place, then re-sort by lastMessageAt (newest first)
        const next = [...prev];
        next[idx] = item;
        next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        return next;
      });

      // If this conversation is currently selected, re-fetch its messages
      // so the operator sees the new customer message.
      if (item.id === selectedIdRef.current) {
        loadMessages(item.id);
      }
    });

    // queue:removed — conversation left the queue (closed, released, deleted).
    socket.on("queue:removed", (payload: { id: string }) => {
      setQueue((prev) => prev.filter((c) => c.id !== payload.id));
      // If the removed conversation was selected, deselect it.
      if (payload.id === selectedIdRef.current) {
        setSelectedId(null);
        setMessages([]);
      }
    });

    socket.on("error", (err: { message?: string }) => {
      toast.error(err?.message ?? "خطا در ارتباط با سرور چت");
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, loadMessages]);

  // Send reply via Socket.io (preferred) with REST fallback.
  const sendReply = useCallback(
    async (text: string) => {
      if (!selectedId || !text.trim()) return;
      setSending(true);
      try {
        if (socketRef.current?.connected) {
          // Send via socket — no REST round-trip needed.
          socketRef.current.emit("operator:reply", {
            conversationId: selectedId,
            text: text.trim(),
          });
          // Optimistically add the operator message to the local list.
          setMessages((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              senderType: "OPERATOR",
              layer: null,
              content: text.trim(),
              metadata: null,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          // Fallback: REST
          await chatService.sendOperatorReply(selectedId, text.trim());
          await loadMessages(selectedId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "ارسال پاسخ ناموفق بود";
        toast.error(message);
      } finally {
        setSending(false);
      }
    },
    [selectedId, loadMessages],
  );

  const closeConversation = useCallback(async () => {
    if (!selectedId) return;
    try {
      await chatService.closeOperatorConversation(selectedId);
      toast.success("مکالمه بسته شد");
      // Socket.io queue:removed will handle removing from list + deselecting.
    } catch (err) {
      const message = err instanceof Error ? err.message : "بستن مکالمه ناموفق بود";
      toast.error(message);
    }
  }, [selectedId]);

  const releaseConversation = useCallback(async () => {
    if (!selectedId) return;
    try {
      await chatService.releaseOperatorConversation(selectedId);
      toast.success("مکالمه به حالت خودکار برگشت");
      setSelectedId(null);
      setMessages([]);
      // The conversation will leave the operator queue via queue:removed.
    } catch (err) {
      const message = err instanceof Error ? err.message : "آزادسازی مکالمه ناموفق بود";
      toast.error(message);
    }
  }, [selectedId]);

  const deleteConversation = useCallback(async () => {
    if (!selectedId) return;
    try {
      await chatService.deleteOperatorConversation(selectedId);
      toast.success("مکالمه حذف شد");
      setSelectedId(null);
      setMessages([]);
      // Socket.io queue:removed will handle removing from list.
    } catch (err) {
      const message = err instanceof Error ? err.message : "حذف مکالمه ناموفق بود";
      toast.error(message);
    }
  }, [selectedId]);

  return {
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
    refreshQueue,
    sendReply,
    closeConversation,
    releaseConversation,
    deleteConversation,
  };
}
