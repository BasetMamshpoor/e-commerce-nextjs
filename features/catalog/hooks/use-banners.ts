"use client";

import { useQuery } from "@tanstack/react-query";

import { bannersService } from "@/services";
import type { Banner, BannerPosition } from "@/types/domain";

/** Active banners for a given position (or all positions if omitted). */
export function useBanners(position?: BannerPosition) {
  return useQuery<Banner[]>({
    queryKey: ["banners", position ?? "all"],
    queryFn: () => bannersService.list(position ? { position } : undefined),
    staleTime: 2 * 60 * 1000,
  });
}
