"use client";

import { useQuery } from "@tanstack/react-query";

import { searchService } from "@/services";
import type { GlobalSearchResult, MainSearchResult, QuickSearchResult } from "@/types/domain";

export const SEARCH_QUERY_KEY = ["search"] as const;

/** Global search across products, blog posts, categories, brands. */
export function useGlobalSearch(q: string, enabled = true) {
  return useQuery<GlobalSearchResult>({
    queryKey: [...SEARCH_QUERY_KEY, "global", q],
    queryFn: () => searchService.global(q),
    enabled: enabled && q.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}

/** Quick autocomplete search — limited to 5 results per type. */
export function useQuickSearch(q: string, enabled = true) {
  return useQuery<QuickSearchResult[]>({
    queryKey: [...SEARCH_QUERY_KEY, "quick", q],
    queryFn: () => searchService.quick(q),
    enabled: enabled && q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

/** Main search with filters and pagination. */
export function useMainSearch(params: {
  q: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  brandIds?: string;
  categoryIds?: string;
  inStock?: boolean;
  hasDiscount?: boolean;
}, enabled = true) {
  return useQuery<MainSearchResult>({
    queryKey: [...SEARCH_QUERY_KEY, "main", params],
    queryFn: () => searchService.main(params),
    enabled: enabled && params.q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
