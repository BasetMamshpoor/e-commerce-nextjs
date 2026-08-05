/**
 * Chat Engine service — live chat widget + operator panel integration.
 * Connects to the chat-engine backend via Socket.io + REST.
 */

import { getAccessToken } from "@/lib/api-client";

export interface ChatMessage {
  id?: string;
  senderType: "CUSTOMER" | "ENGINE" | "OPERATOR" | "SYSTEM";
  layer?: string | null;
  content: string;
  createdAt?: string;
}

export interface ChatHistoryResponse {
  conversationId: string | null;
  messages: ChatMessage[];
}

export interface ChatReplyPayload {
  conversationId: string;
  text: string;
  layer?: string;
  needsOperator?: boolean;
}

export interface ChatSendBody {
  guestToken: string;
  text: string;
  displayName?: string;
  storeUserId?: number;
}

export type OperatorConversationStatus =
  | "OPEN"
  | "AI_HANDLING"
  | "NEEDS_OPERATOR"
  | "WITH_OPERATOR"
  | "CLOSED";

export interface OperatorQueueCustomer {
  _id?: string;
  displayName?: string;
  externalId?: string;
  storeUserId?: number | null;
  channel?: string;
}

export interface OperatorQueueConversation {
  id: string;
  channel: string;
  status: OperatorConversationStatus;
  customer: OperatorQueueCustomer | null;
  lastMessageAt: string;
}

export interface OperatorChatMessage {
  id: string;
  senderType: "CUSTOMER" | "ENGINE" | "OPERATOR" | "SYSTEM";
  layer?: string | null;
  content: string;
  createdAt: string;
}

/** Get or create a persistent guest token for the chat widget. */
export function getChatGuestToken(): string {
  if (typeof window === "undefined") return "";
  const KEY = "chat_guest_token";
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:8001/api";
const WS_BASE = process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "http://localhost:8001";

async function chatFetch<T>(path: string, options?: RequestInit, auth = false): Promise<T> {
  const token = auth ? getAccessToken() : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "درخواست ناموفق بود");
  return json.data as T;
}

export const chatService = {
  apiBase: API_BASE,
  wsBase: WS_BASE,

  /** Get chat history for the current guest token. */
  getHistory: async (guestToken: string): Promise<ChatHistoryResponse> =>
    chatFetch<ChatHistoryResponse>(`/chat/messages?guestToken=${encodeURIComponent(guestToken)}`),

  /** Send a message via REST (fallback when WebSocket is unavailable). */
  sendMessage: async (body: ChatSendBody): Promise<{ reply: ChatReplyPayload; status: string }> => {
    const data = await chatFetch<{ reply: ChatReplyPayload; status: string }>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data;
  },

  /** Operator: list conversations waiting for or handled by support. */
  getOperatorQueue: async (status?: "NEEDS_OPERATOR" | "WITH_OPERATOR"): Promise<OperatorQueueConversation[]> => {
    const query = status ? `?status=${status}` : "";
    return chatFetch<OperatorQueueConversation[]>(`/operator/queue${query}`, undefined, true);
  },

  /** Operator: get messages for a conversation. */
  getOperatorConversation: async (conversationId: string): Promise<OperatorChatMessage[]> =>
    chatFetch<OperatorChatMessage[]>(`/operator/conversations/${conversationId}`, undefined, true),

  /** Operator: reply to a customer (delivered in real-time to the chat widget). */
  sendOperatorReply: async (conversationId: string, text: string): Promise<void> => {
    await chatFetch<{ id: string | null }>(
      "/operator/reply",
      {
        method: "POST",
        body: JSON.stringify({ conversationId, text }),
      },
      true,
    );
  },

  /** Operator: close a conversation. */
  closeOperatorConversation: async (conversationId: string): Promise<void> => {
    await chatFetch<{ id: string; status: string }>(
      `/operator/conversations/${conversationId}/close`,
      { method: "POST" },
      true,
    );
  },
};
