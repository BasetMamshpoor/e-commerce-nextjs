/**
 * Chat Engine API client — dedicated axios instance for the chat-engine
 * backend (port 4100). Completely separate from the main api-client.ts
 * (port 4000) so they don't share interceptors, base URLs, or guest tokens.
 *
 * Reuses the same NextAuth access token (via getAccessToken) so
 * authenticated requests to chat-engine carry the user's JWT.
 * Also handles 401 auto-refresh via the same auth:token-expired event.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import {
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiError,
} from "@/types/api";
import { getAccessToken } from "@/lib/api-client";

const isBrowser = typeof window !== "undefined";

const CHAT_API_BASE =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:4100/api";

/* ──────────────────────────────────────────────────────────────────────────
   Axios instance for chat-engine
   ────────────────────────────────────────────────────────────────────────── */

export const chatApiClient: AxiosInstance = axios.create({
  baseURL: CHAT_API_BASE,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ───────── Request interceptor: inject auth token ───────── */

chatApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/* ───────── Response interceptor: unwrap + error mapping ───────── */

function toChatApiError(err: AxiosError<ApiErrorResponse>): ApiError {
  const status = err.response?.status ?? 0;
  const payload = err.response?.data;
  const message =
    payload?.message ||
    (status === 0
      ? "ارتباط با سرور چت برقرار نشد."
      : err.message || "خطای ناشناخته در سرور چت.");
  return new ApiError(message, {
    status,
    code: payload?.success === false ? undefined : (err.code as string | undefined),
    errors: payload?.errors,
    raw: payload ?? err,
  });
}

chatApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    // On 401: signal NextAuth to refresh (same as main api-client).
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      isBrowser
    ) {
      original._retried = true;
      window.dispatchEvent(new CustomEvent("auth:token-expired"));
    }

    return Promise.reject(toChatApiError(error));
  },
);

/* ──────────────────────────────────────────────────────────────────────────
   Typed request helpers — return unwrapped `data`, throw ApiError on failure
   ────────────────────────────────────────────────────────────────────────── */

async function chatRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await chatApiClient.request<ApiSuccessResponse<T>>(config);
  return res.data.data;
}

export const chatHttp = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    chatRequest<T>({ url, method: "GET", params }),

  post: <T>(url: string, body?: unknown) =>
    chatRequest<T>({ url, method: "POST", data: body }),

  patch: <T>(url: string, body?: unknown) =>
    chatRequest<T>({ url, method: "PATCH", data: body }),

  delete: <T>(url: string) =>
    chatRequest<T>({ url, method: "DELETE" }),
};
