/**
 * Chat Engine service — live chat widget integration.
 * Connects to the chat-engine backend via Socket.io + REST.
 */

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

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:4100/api";
const WS_BASE = process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "http://localhost:4100";

export const chatService = {
  apiBase: API_BASE,
  wsBase: WS_BASE,

  /** Get chat history for the current guest token. */
  getHistory: async (guestToken: string): Promise<ChatHistoryResponse> => {
    const res = await fetch(`${API_BASE}/chat/messages?guestToken=${encodeURIComponent(guestToken)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Failed to fetch chat history");
    return json.data as ChatHistoryResponse;
  },

  /** Send a message via REST (fallback when WebSocket is unavailable). */
  sendMessage: async (body: ChatSendBody): Promise<{ reply: ChatReplyPayload; status: string }> => {
    const res = await fetch(`${API_BASE}/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Failed to send message");
    return {
      reply: json.data.reply,
      status: json.data.status,
    };
  },
};
