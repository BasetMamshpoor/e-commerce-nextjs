/**
 * Comparison hooks — REWRITTEN for new API.
 * Only GET /?productIds=1,2,3 — no add/remove/clear.
 * Frontend manages product IDs via URL.
 */

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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

/**
 * Toggle a product in/out of the comparison set stored in the URL.
 * Comparison state lives in the URL: /comparison/1/2/3
 */
export function useComparisonToggle() {
  const router = useRouter();
  const pathname = usePathname();

  const ids = React.useMemo(() => {
    if (!pathname) return new Set<number>();
    const match = pathname.match(/^\/comparison(?:\/(.+))?$/);
    if (!match || !match[1]) return new Set<number>();
    const parts = match[1].split("/").filter(Boolean);
    return new Set<number>(parts.map((p) => Number(p)).filter((n) => !Number.isNaN(n)));
  }, [pathname]);

  return {
    isInComparison: (productId: number) => ids.has(productId),
    toggle: (productId: number) => {
      const next = new Set(ids);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      const arr = Array.from(next);
      router.push(arr.length === 0 ? "/comparison" : `/comparison/${arr.join("/")}`);
    },
  };
}

