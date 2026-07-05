/**
 * React Query client + provider
 */

import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 1 min
        gcTime: 5 * 60 * 1000,       // 5 min
        retry: (failureCount, error) => {
          // Don't retry on auth/client errors or rate limits (429).
          // Retrying 429s causes infinite loops when the backend rate-limits
          // analytics/dashboard endpoints.
          const status = (error as { status?: number })?.status ?? 0;
          if (status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
      mutations: {
        retry: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (q) =>
          defaultShouldDehydrateQuery(q) ||
          q.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
