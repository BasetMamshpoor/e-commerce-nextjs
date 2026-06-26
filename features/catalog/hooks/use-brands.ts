"use client";

import { useQuery } from "@tanstack/react-query";

import { brandsService } from "@/services";
import type { Brand } from "@/types/domain";

/** List all active brands. */
export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: () => brandsService.list(),
    staleTime: 10 * 60 * 1000,
  });
}
