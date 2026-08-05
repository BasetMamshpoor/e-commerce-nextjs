"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

import {
  chatService,
  type OperatorChatMessage,
  type OperatorQueueConversation,
} from "@/services/chat.service";
import { getAccessToken } from "@/lib/api-client";

type QueueFilter = "ALL" | "NEEDS_OPERATOR" | "WITH_OPERATOR";

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

  const refreshQueue = useCallback(async () => {
    try {
      const status = queueFilter === "ALL" ? undefined : queueFilter;
      const data = await chatService.getOperatorQueue(status);
      setQueue(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "بارگذاری صف ناموفق بود";
      toast.error(message);
    } finally {
      setLoadingQueue(false);
    }
  }, [queueFilter]);

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

  useEffect(() => {
    setLoadingQueue(true);
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId);
    const interval = setInterval(() => {
      loadMessages(selectedId);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${chatService.wsBase}/operator`, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("queue:new", () => {
      refreshQueue();
      const activeId = selectedIdRef.current;
      if (activeId) loadMessages(activeId);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, refreshQueue, loadMessages]);

  const sendReply = useCallback(
    async (text: string) => {
      if (!selectedId || !text.trim()) return;
      setSending(true);
      try {
        await chatService.sendOperatorReply(selectedId, text.trim());
        await loadMessages(selectedId);
        await refreshQueue();
      } catch (err) {
        const message = err instanceof Error ? err.message : "ارسال پاسخ ناموفق بود";
        toast.error(message);
      } finally {
        setSending(false);
      }
    },
    [selectedId, loadMessages, refreshQueue],
  );

  const closeConversation = useCallback(async () => {
    if (!selectedId) return;
    try {
      await chatService.closeOperatorConversation(selectedId);
      toast.success("مکالمه بسته شد");
      setSelectedId(null);
      await refreshQueue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "بستن مکالمه ناموفق بود";
      toast.error(message);
    }
  }, [selectedId, refreshQueue]);

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
  };
}
