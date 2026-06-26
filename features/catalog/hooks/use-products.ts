"use client";

import { useQuery } from "@tanstack/react-query";

import { productsService } from "@/services";
import type { PaginatedData, Product, ProductListQuery } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

/**
 * Fetch the storefront product list with filters.
 *
 * Pass `pageKey` to keep separate cache entries for different filter combinations.
 * e.g. `["products", "list", query]` will dedupe identical queries.
 */
export function useProducts(query: ProductListQuery = {}) {
  return useQuery<PaginatedData<Product>>({
    queryKey: ["products", "list", query],
    queryFn: () => productsService.list({ limit: APP_CONFIG.defaultPageSize, ...query }),
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  });
}
