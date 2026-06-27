"use client";

import { useQuery } from "@tanstack/react-query";

import { brandsService } from "@/services";
import type { Brand } from "@/types/domain";

/** Single brand by slug. */
export function useBrandBySlug(slug: string | undefined) {
  return useQuery<Brand>({
    queryKey: ["brands", "bySlug", slug],
    queryFn: () => brandsService.bySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
