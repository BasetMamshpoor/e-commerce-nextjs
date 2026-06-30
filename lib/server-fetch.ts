/**
 * Server-side data fetching utilities.
 * Used in Server Components for SSR — no browser APIs (localStorage, window, etc).
 */

import { APP_CONFIG } from "@/constants/app";

const API_BASE = APP_CONFIG.apiBaseUrl;

export interface ServerFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Auth token (passed from server cookies/headers if available) */
  authToken?: string;
  /** Guest token for cart/comparison */
  guestToken?: string;
  /** Cache revalidation in seconds */
  revalidate?: number;
  /** Cache tag for on-demand revalidation */
  tags?: string[];
}

/**
 * Server-side fetch that talks directly to the backend API.
 * Returns the unwrapped `data` from `{ success, message, data }`.
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    authToken,
    guestToken,
    revalidate = 60, // Default: revalidate every 60 seconds
    tags,
  } = options;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (authToken) {
    requestHeaders["Authorization"] = `Bearer ${authToken}`;
  }
  if (guestToken) {
    requestHeaders["X-Guest-Token"] = guestToken;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  // Next.js fetch extension for caching
  const nextOptions: { revalidate?: number; tags?: string[] } = {};
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;
  if (tags) nextOptions.tags = tags;

  if (method === "GET") {
    fetchOptions.next = nextOptions;
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: "خطای ناشناخته" }));
    throw new Error(errorBody.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

/* ───────── Prefetch helpers for React Query hydration ───────── */

import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
  type QueryKey,
} from "@tanstack/react-query";

/**
 * Create a query client for server-side prefetching.
 * This client is used to prefetch queries on the server,
 * then dehydrated and sent to the client for hydration.
 */
export function makeServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

/**
 * Prefetch a single query on the server.
 * Returns the dehydrated state for HydrationBoundary.
 */
export async function prefetchQueries(
  prefetchFn: (client: QueryClient) => Promise<void>,
) {
  const queryClient = makeServerQueryClient();
  await prefetchFn(queryClient);
  return dehydrate(queryClient);
}

export { HydrationBoundary, type QueryKey };
