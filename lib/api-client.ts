/**
 * Centralized Axios client — works with NextAuth (Auth.js v5).
 *
 * NextAuth manages access/refresh tokens in an encrypted JWT cookie.
 * The jwt callback in auth.ts handles automatic refresh when the
 * access token expires — users never need to re-login.
 *
 * This module:
 *   - Keeps a module-level `currentAccessToken` synced from the NextAuth session
 *     by the <AxiosAuthSync/> component (client-side).
 *   - Injects Authorization + X-Guest-Token headers via interceptor.
 *   - On 401: dispatches event so the session can be refreshed via NextAuth.
 *   - Supports server-side token override via config (for SSR with auth()).
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { APP_CONFIG } from "@/constants/app";
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiError,
} from "@/types/api";

/* ──────────────────────────────────────────────────────────────────────────
   Access token — synced from NextAuth session by AxiosAuthSync component
   ────────────────────────────────────────────────────────────────────────── */

let currentAccessToken: string | null = null;

/** Called by <AxiosAuthSync/> whenever the NextAuth session changes. */
export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

/** Get the current access token (for use in interceptors). */
export function getAccessToken(): string | null {
  return currentAccessToken;
}

/* ──────────────────────────────────────────────────────────────────────────
   Guest token (X-Guest-Token) — used by cart for anonymous users
   ────────────────────────────────────────────────────────────────────────── */

const isBrowser = typeof window !== "undefined";

export function getGuestToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(APP_CONFIG.storageKeys.guestToken);
}

export function setGuestToken(token: string) {
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem(APP_CONFIG.storageKeys.guestToken, token);
  } else {
    localStorage.removeItem(APP_CONFIG.storageKeys.guestToken);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Axios instance
   ────────────────────────────────────────────────────────────────────────── */

export const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ───────── Request interceptor: inject auth headers ───────── */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Use token from config override (for SSR) or from module-level variable (client).
  const token =
    (config.headers?.["x-ssr-token"] as string | undefined) ?? getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  // Clean up the SSR-only header so backend doesn't see it.
  if (config.headers?.["x-ssr-token"]) {
    config.headers.delete("x-ssr-token");
  }
  // Guest token for cart (anonymous users).
  const guestToken = getGuestToken();
  if (guestToken) {
    config.headers.set("X-Guest-Token", guestToken);
  }
  return config;
});

/* ───────── Response interceptor: unwrap + error mapping ───────── */

function toApiError(err: AxiosError<ApiErrorResponse>): ApiError {
  const status = err.response?.status ?? 0;
  const payload = err.response?.data;
  const message =
    payload?.message ||
    (status === 0
      ? "ارتباط با سرور برقرار نشد. لطفاً اینترنت خود را بررسی کنید."
      : err.message || "خطای ناشناخته رخ داد.");
  return new ApiError(message, {
    status,
    code: payload?.success === false ? undefined : (err.code as string | undefined),
    errors: payload?.errors,
    raw: payload ?? err,
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    // On 401: signal the NextAuth session to refresh.
    // NextAuth's jwt callback will use the refresh token to get a new access token.
    // If refresh fails, the user will be signed out.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      isBrowser
    ) {
      original._retried = true;
      // Dispatch event — AxiosAuthSync listens and calls session update.
      window.dispatchEvent(new CustomEvent("auth:token-expired"));
    }

    return Promise.reject(toApiError(error));
  },
);

/* ──────────────────────────────────────────────────────────────────────────
   Typed request helpers — return unwrapped `data`, throw ApiError on failure
   ────────────────────────────────────────────────────────────────────────── */

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.request<ApiSuccessResponse<T>>(config);
  return res.data.data;
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown> | object, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "GET", params, ...config }),

  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "POST", data: body, ...config }),

  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "PUT", data: body, ...config }),

  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "PATCH", data: body, ...config }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "DELETE", ...config }),

  /** Multipart upload with POST (caller builds FormData). */
  upload: async <T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await apiClient.post<ApiSuccessResponse<T>>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data", ...(config?.headers ?? {}) },
    });
    return res.data.data;
  },

  /** Multipart upload with PUT (for updating resources with files). */
  uploadPut: async <T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await apiClient.put<ApiSuccessResponse<T>>(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data", ...(config?.headers ?? {}) },
    });
    return res.data.data;
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   SSR helper — create a config with server-side token override
   ────────────────────────────────────────────────────────────────────────── */

/**
 * For server-side data fetching: pass the access token from auth() session.
 * Usage: `http.get(ENDPOINTS.usersMe.get, undefined, withSSRToken(session?.accessToken))`
 */
export function withSSRToken(accessToken?: string): AxiosRequestConfig {
  if (!accessToken) return {};
  return {
    headers: { "x-ssr-token": accessToken },
  };
}
