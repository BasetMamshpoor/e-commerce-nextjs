/**
 * Centralized Axios client + React Query integration
 *
 * Features:
 *   - Single axios instance for the whole app
 *   - Request interceptor: inject Authorization + X-Guest-Token headers
 *   - Response interceptor: unwrap { success, data } envelope
 *   - Refresh-token rotation: on 401, transparently refresh once and retry
 *   - Centralized error handling: ApiError with status, code, raw payload
 *   - SSR-safe: no localStorage on server
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { APP_CONFIG } from "@/constants/app";
import { ENDPOINTS } from "@/api/endpoints";
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiError,
} from "@/types/api";
import { AuthSession } from "@/types/domain";

/* ──────────────────────────────────────────────────────────────────────────
   Token storage abstraction (SSR-safe)
   ────────────────────────────────────────────────────────────────────────── */

const isBrowser = typeof window !== "undefined";

interface TokenBundle {
  accessToken: string | null;
  refreshToken: string | null;
}

let memoryTokens: TokenBundle = {
  accessToken: null,
  refreshToken: null,
};

/** Subscribers that want to be notified when tokens change (e.g. AuthProvider). */
type TokenListener = (tokens: TokenBundle) => void;
const tokenListeners = new Set<TokenListener>();

export function subscribeTokens(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

function notifyTokens() {
  for (const l of tokenListeners) l({ ...memoryTokens });
}

export function setTokens(tokens: Partial<TokenBundle>) {
  memoryTokens = { ...memoryTokens, ...tokens };
  if (isBrowser) {
    if (tokens.accessToken !== undefined) {
      if (tokens.accessToken)
        localStorage.setItem(APP_CONFIG.storageKeys.accessToken, tokens.accessToken);
      else localStorage.removeItem(APP_CONFIG.storageKeys.accessToken);
    }
    if (tokens.refreshToken !== undefined) {
      if (tokens.refreshToken)
        localStorage.setItem(APP_CONFIG.storageKeys.refreshToken, tokens.refreshToken);
      else localStorage.removeItem(APP_CONFIG.storageKeys.refreshToken);
    }
  }
  notifyTokens();
}

export function getAccessToken(): string | null {
  if (memoryTokens.accessToken) return memoryTokens.accessToken;
  if (isBrowser) {
    const t = localStorage.getItem(APP_CONFIG.storageKeys.accessToken);
    if (t) memoryTokens.accessToken = t;
    return t;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (memoryTokens.refreshToken) return memoryTokens.refreshToken;
  if (isBrowser) {
    const t = localStorage.getItem(APP_CONFIG.storageKeys.refreshToken);
    if (t) memoryTokens.refreshToken = t;
    return t;
  }
  return null;
}

export function clearTokens() {
  memoryTokens = { accessToken: null, refreshToken: null };
  if (isBrowser) {
    localStorage.removeItem(APP_CONFIG.storageKeys.accessToken);
    localStorage.removeItem(APP_CONFIG.storageKeys.refreshToken);
    localStorage.removeItem(APP_CONFIG.storageKeys.user);
  }
  notifyTokens();
}

/* ──────────────────────────────────────────────────────────────────────────
   Guest token (X-Guest-Token) — used by cart + comparison for anonymous users
   ────────────────────────────────────────────────────────────────────────── */

export function getGuestToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(APP_CONFIG.storageKeys.guestToken);
}

export function setGuestToken(token: string) {
  if (!isBrowser) return;
  localStorage.setItem(APP_CONFIG.storageKeys.guestToken, token);
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
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  // Always send guest token if present (cart + comparison need it even when authed,
  // for the brief window before /cart/merge is called).
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
      | (InternalAxiosRequestConfig & { _retried?: boolean; _refreshing?: boolean })
      | undefined;

    // 401 → try refresh once
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes(ENDPOINTS.auth.refreshToken) &&
      !original.url?.includes(ENDPOINTS.auth.login) &&
      !original.url?.includes(ENDPOINTS.auth.register)
    ) {
      original._retried = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await axios.post<
            ApiSuccessResponse<{
              accessToken: string;
              refreshToken: string;
              sessionId: string;
            }>
          >(
            `${APP_CONFIG.apiBaseUrl}${ENDPOINTS.auth.refreshToken}`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } },
          );
          const { accessToken: newAt, refreshToken: newRt } = refreshRes.data.data;
          setTokens({ accessToken: newAt, refreshToken: newRt });
          original.headers.set("Authorization", `Bearer ${newAt}`);
          return apiClient(original);
        } catch (refreshErr) {
          // Refresh failed → clear session, let caller handle
          clearTokens();
          if (isBrowser) {
            // Notify auth provider via custom event
            window.dispatchEvent(new CustomEvent("auth:session-expired"));
          }
          return Promise.reject(toApiError(error));
        }
      } else {
        clearTokens();
        if (isBrowser) {
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
      }
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

  /** Raw axios access for multipart uploads (caller builds FormData). Uses POST by default. */
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

  /** Multipart upload with PUT method (for updating resources with files). */
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
   Session bootstrapper — call once on app start to hydrate tokens from storage
   ────────────────────────────────────────────────────────────────────────── */

export function hydrateSession(): TokenBundle {
  if (!isBrowser) return { accessToken: null, refreshToken: null };
  const at = localStorage.getItem(APP_CONFIG.storageKeys.accessToken);
  const rt = localStorage.getItem(APP_CONFIG.storageKeys.refreshToken);
  memoryTokens = { accessToken: at, refreshToken: rt };
  notifyTokens();
  return memoryTokens;
}

/** Persist an AuthSession (from login/register/verify-otp) into storage + memory. */
export function persistSession(session: AuthSession) {
  setTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  if (isBrowser) {
    localStorage.setItem(
      APP_CONFIG.storageKeys.user,
      JSON.stringify(session.user),
    );
  }
}

/** Read the cached user (without an HTTP roundtrip). Used for instant UI render. */
export function getCachedUser(): AuthSession["user"] | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(APP_CONFIG.storageKeys.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession["user"];
  } catch {
    return null;
  }
}
