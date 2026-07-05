/**
 * Comparison hooks — REWRITTEN for new API.
 * Only GET /?productIds=1,2,3 — no add/remove/clear.
 * Frontend manages product IDs via URL.
 */

import { useQuery } from "@tanstack/react-query";
import { comparisonService } from "@/services";

export const COMPARISON_QUERY_KEY = ["comparison"] as const;

/** Fetch comparison data for given product IDs. */
export function useComparison(productIds: number[]) {
  return useQuery({
    queryKey: [...COMPARISON_QUERY_KEY, productIds],
    queryFn: () => comparisonService.get(productIds),
    enabled: productIds.length > 0,
    staleTime: 30 * 1000,
  });
}
