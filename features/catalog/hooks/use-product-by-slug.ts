"use client";

import { useQuery } from "@tanstack/react-query";

import { productsService } from "@/services";
import type { Product } from "@/types/domain";

/**
 * Fetch a single published product by slug.
 * Used by /products/[slug] page.
 */
export function useProductBySlug(slug: string | undefined) {
  return useQuery<Product>({
    queryKey: ["products", "bySlug", slug],
    queryFn: () => productsService.bySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}
