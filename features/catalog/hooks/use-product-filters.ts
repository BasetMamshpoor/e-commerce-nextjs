"use client";

import { useQuery } from "@tanstack/react-query";

import { productsService } from "@/services";
import type { ProductFilterMetadata } from "@/types/domain";

/**
 * Fetch filter metadata for the shop page (brands, price range, attributes).
 * Optional `categorySlug` to scope filters to a category.
 */
export function useProductFilters(categorySlug?: string) {
  return useQuery<ProductFilterMetadata>({
    queryKey: ["products", "filters", categorySlug ?? "all"],
    queryFn: () => productsService.filters(categorySlug),
    staleTime: 5 * 60 * 1000,
  });
}
