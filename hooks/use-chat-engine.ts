"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  chatService,
  getChatGuestToken,
  chatWsBase,
  type ChatMessage,
} from "@/services/chat.service";
import { useAuth } from "@/providers/auth-context";

export interface UseChatEngineReturn {
  messages: ChatMessage[];
  connected: boolean;
  waitingForOperator: boolean;
  sendMessage: (text: string) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  unreadCount: number;
}

export function useChatEngine(): UseChatEngineReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [waitingForOperator, setWaitingForOperator] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const guestTokenRef = useRef<string>("");
  const { user } = useAuth();
  const isOpenRef = useRef(isOpen);

  // Keep isOpenRef in sync so socket callbacks can read current value.
  // Reset unread count when opening — done via callback, not effect.
  const handleSetOpen = useCallback((open: boolean) => {
    isOpenRef.current = open;
    if (open) setUnreadCount(0);
    setOpen(open);
  }, []);

  useEffect(() => {
    const guestToken = getChatGuestToken();
    guestTokenRef.current = guestToken;

    // 1. Fetch history via REST (uses chatHttp → auth token injected)
    chatService
      .getHistory(guestToken)
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});

    // 2. Connect WebSocket
    const socket = io(`${chatWsBase}/chat`, {
      query: { guestToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("engine:reply", (payload: { text: string; needsOperator?: boolean }) => {
      setMessages((prev) => [...prev, { senderType: "ENGINE", content: payload.text }]);
      setWaitingForOperator(payload.needsOperator ?? false);
      if (!isOpenRef.current) setUnreadCount((c) => c + 1);
    });

    socket.on("operator:reply", (payload: { text: string }) => {
      setMessages((prev) => [...prev, { senderType: "OPERATOR", content: payload.text }]);
      setWaitingForOperator(false);
      if (!isOpenRef.current) setUnreadCount((c) => c + 1);
    });

    // Fired when the conversation is already WITH_OPERATOR (sticky — see
    // docs/FRONTEND_INTEGRATION.md) so no automated reply was generated;
    // this is just a delivery ack. No message to append — waitingForOperator
    // is already true from the earlier engine:reply that triggered the
    // handoff, and stays true until an actual operator:reply arrives.
    socket.on("message:received", () => {
      /* no-op ack */
    });

    socket.on("error", (err: { message?: string }) => {
      setMessages((prev) => [
        ...prev,
        { senderType: "SYSTEM", content: err.message ?? "خطا در ارتباط با سرور" },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // Optimistic: add user message immediately
      setMessages((prev) => [...prev, { senderType: "CUSTOMER", content: text }]);

      if (socketRef.current?.connected) {
        socketRef.current.emit("message:send", {
          text,
          displayName: user?.fullName,
          storeUserId: user?.id,
        });
      } else {
        // Fallback: REST (uses chatHttp → auth token injected)
        chatService
          .sendMessage({
            guestToken: guestTokenRef.current,
            text,
            displayName: user?.fullName,
            storeUserId: user?.id,
          })
          .then(({ reply }) => {
            setMessages((prev) => [...prev, { senderType: "ENGINE", content: reply.text }]);
            setWaitingForOperator(reply.needsOperator ?? false);
          })
          .catch(() => {
            setMessages((prev) => [
              ...prev,
              { senderType: "SYSTEM", content: "ارسال ناموفق بود. دوباره تلاش کنید." },
            ]);
          });
      }
    },
    [user],
  );

  return { messages, connected, waitingForOperator, sendMessage, isOpen, setOpen: handleSetOpen, unreadCount };
}
