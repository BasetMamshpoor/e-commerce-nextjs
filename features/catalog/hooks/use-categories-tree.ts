"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesService } from "@/services";
import type { Category } from "@/types/domain";

/**
 * Fetch the full category tree (used for nav + home page category grid).
 * Stale for 5 minutes — categories don't change often.
 */
export function useCategoriesTree() {
  return useQuery<Category[]>({
    queryKey: ["categories", "tree"],
    queryFn: () => categoriesService.tree(),
    staleTime: 5 * 60 * 1000,
  });
}
