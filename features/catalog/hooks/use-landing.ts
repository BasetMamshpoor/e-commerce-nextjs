"use client";

import { useQuery } from "@tanstack/react-query";

import { landingService } from "@/services";
import type { LandingData } from "@/types/domain";

export const LANDING_QUERY_KEY = ["landing"] as const;

/**
 * Fetch unified landing page data — returns all home sections in one call.
 * Sections: banners, popups, stories, categories, featured_products,
 * latest_products, top_rated_products, flash_sales, latest_blog_posts,
 * popular_brands. Also returns site settings (store_name, instagram_url, ...).
 */
export function useLanding() {
  return useQuery<LandingData>({
    queryKey: LANDING_QUERY_KEY,
    queryFn: () => landingService.get(),
    staleTime: 2 * 60 * 1000,
  });
}
