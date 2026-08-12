/**
 * Chat Engine service — live chat widget + operator console.
 * Connects to the chat-engine backend via Socket.io + REST.
 *
 * Uses chatHttp (dedicated axios instance at /lib/chat-api-client.ts)
 * instead of raw fetch — so auth tokens are automatically injected
 * and 401s trigger NextAuth refresh.
 *
 * The chat-engine verifies the same JWT access token as the main
 * backend (shared JWT_ACCESS_SECRET), so the Bearer token injected
 * by chatHttp works for both customer and operator endpoints.
 */

import { chatHttp, chatApiClient } from "@/lib/chat-api-client";
import { APP_CONFIG } from "@/constants/app";

/* ───────── Customer-facing types ───────── */

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

export interface ChatSendResponse {
  conversationId: string;
  status: string;
  reply: ChatReplyPayload;
}

/* ───────── Operator-facing types ───────── */

export type ConversationStatus =
  | "OPEN"
  | "AI_HANDLING"
  | "NEEDS_OPERATOR"
  | "WITH_OPERATOR"
  | "CLOSED";

export type ConversationChannel =
  | "WEBSITE"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "TELEGRAM"
  | "BALE";

export interface OperatorQueueConversation {
  id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  customer: {
    _id?: string;
    guestToken?: string;
    displayName?: string | null;
    externalId?: string | null;
    storeUserId?: number | null;
  };
  lastMessageAt: string;
}

export interface OperatorChatMessage {
  id: string;
  senderType: "CUSTOMER" | "ENGINE" | "OPERATOR" | "SYSTEM";
  layer?: string | null;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface OperatorReplyBody {
  conversationId: string;
  text: string;
}

export interface OperatorQueueQuery {
  status?: ConversationStatus;
  channel?: ConversationChannel;
}

/* ───────── Guest token management ───────── */

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

/* ───────── WebSocket base URL ───────── */

/** WebSocket base URL (without /api path). */
export const chatWsBase =
  process.env.NEXT_PUBLIC_CHAT_WS_URL ??
  APP_CONFIG.backendRootUrl.replace(":4000", ":4100");

/* ───────── Service ───────── */

export const chatService = {
  /* ── Customer endpoints ── */

  /** Get chat history for the current guest token. */
  getHistory: (guestToken: string) =>
    chatHttp.get<ChatHistoryResponse>("/chat/messages", { guestToken }),

  /** Send a message via REST (fallback when WebSocket is unavailable). */
  sendMessage: (body: ChatSendBody) =>
    chatHttp.post<ChatSendResponse>("/chat/messages", body),

  /* ── Operator endpoints (require ADMIN/EDITOR/SUPPORT role) ── */

  /** Get the queue of conversations needing operator attention.
   *  Without status param, returns NEEDS_OPERATOR + WITH_OPERATOR (classic queue).
   *  With status, returns conversations matching that status. */
  getOperatorQueue: (params?: OperatorQueueQuery) =>
    chatHttp.get<OperatorQueueConversation[]>("/operator/queue", params as Record<string, unknown> | undefined),

  /** Get all messages in a conversation (operator view). */
  getOperatorConversation: (conversationId: string) =>
    chatHttp.get<OperatorChatMessage[]>(`/operator/conversations/${conversationId}`),

  /** Send an operator reply to a conversation (REST fallback for socket). */
  sendOperatorReply: (conversationId: string, text: string) =>
    chatHttp.post<{ id: string | null }>("/operator/reply", { conversationId, text }),

  /** Close a conversation (ends the thread — next customer message starts fresh). */
  closeOperatorConversation: (conversationId: string) =>
    chatHttp.post<{ id: string; status: string }>(`/operator/conversations/${conversationId}/close`),

  /** Release a conversation back to automated layers (AI/keywords resume). */
  releaseOperatorConversation: (conversationId: string) =>
    chatHttp.post<{ id: string; status: string }>(`/operator/conversations/${conversationId}/release`),

  /** Delete a conversation and all its messages (irreversible). */
  deleteOperatorConversation: (conversationId: string) =>
    chatHttp.delete<{ id: string }>(`/operator/conversations/${conversationId}`),

  /** Build the URL for a Telegram media proxy (photos/voice from Telegram).
   *  Returns a URL that can be used with fetch + Authorization header,
   *  then converted to a blob URL for <img src> or <audio src>. */
  getOperatorMediaUrl: (conversationId: string, messageId: string) =>
    `${chatApiClient.defaults.baseURL}/operator/conversations/${conversationId}/messages/${messageId}/media`,

  /* ── Exposed for Socket.io connections ── */

  /** WebSocket base URL (for socket.io connections). */
  wsBase: chatWsBase,
};
