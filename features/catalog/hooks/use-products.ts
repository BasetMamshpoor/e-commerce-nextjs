"use client";

import { useQuery } from "@tanstack/react-query";

import { productsService } from "@/services";
import type { Product, ProductListQuery } from "@/types/domain";
import type { PaginatedData } from "@/types/api";
import { APP_CONFIG } from "@/constants/app";

/**
 * Fetch the storefront product list with filters.
 *
 * Pass `pageKey` to keep separate cache entries for different filter combinations.
 * e.g. `["products", "list", query]` will dedupe identical queries.
 *
 * Pass `options.enabled = false` to skip fetching (e.g. when backend already
 * provided relatedProducts).
 */
export function useProducts(
  query: ProductListQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedData<Product>>({
    queryKey: ["products", "list", query],
    queryFn: () => productsService.list({ limit: APP_CONFIG.defaultPageSize, ...query }),
    placeholderData: (prev) => prev, // keep previous data while fetching next page
    enabled: options?.enabled ?? true,
  });
}
