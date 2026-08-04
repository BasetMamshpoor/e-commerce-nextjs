"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { chatService, getChatGuestToken, type ChatMessage } from "@/services/chat.service";
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

  useEffect(() => {
    const guestToken = getChatGuestToken();
    guestTokenRef.current = guestToken;

    // 1. Fetch history
    chatService
      .getHistory(guestToken)
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});

    // 2. Connect WebSocket
    const socket = io(`${chatService.wsBase}/chat`, {
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
      if (!isOpen) setUnreadCount((c) => c + 1);
    });

    socket.on("operator:reply", (payload: { text: string }) => {
      setMessages((prev) => [...prev, { senderType: "OPERATOR", content: payload.text }]);
      setWaitingForOperator(false);
      if (!isOpen) setUnreadCount((c) => c + 1);
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
        // Fallback: REST
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

  return { messages, connected, waitingForOperator, sendMessage, isOpen, setOpen, unreadCount };
}
