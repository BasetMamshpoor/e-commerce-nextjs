"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsService } from "@/services";
import type {
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsSalesPoint,
  AnalyticsOrderStatusBreakdown,
  AnalyticsTopProduct,
  AnalyticsNewUsersPoint,
} from "@/types/domain";

export const ANALYTICS_QUERY_KEY = ["analytics"] as const;

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: [...ANALYTICS_QUERY_KEY, "overview"],
    queryFn: () => analyticsService.overview(),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsSalesOverTime(query?: { from?: string; to?: string; period?: AnalyticsPeriod }) {
  return useQuery<AnalyticsSalesPoint[]>({
    queryKey: [...ANALYTICS_QUERY_KEY, "sales", query ?? {}],
    queryFn: () => analyticsService.salesOverTime(query),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsOrderStatus() {
  return useQuery<AnalyticsOrderStatusBreakdown[]>({
    queryKey: [...ANALYTICS_QUERY_KEY, "order-status"],
    queryFn: () => analyticsService.orderStatusBreakdown(),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsTopProducts(query?: { limit?: number; from?: string; to?: string }) {
  return useQuery<AnalyticsTopProduct[]>({
    queryKey: [...ANALYTICS_QUERY_KEY, "top-products", query ?? {}],
    queryFn: () => analyticsService.topProducts(query),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsNewUsers(query?: { from?: string; to?: string; period?: AnalyticsPeriod }) {
  return useQuery<AnalyticsNewUsersPoint[]>({
    queryKey: [...ANALYTICS_QUERY_KEY, "new-users", query ?? {}],
    queryFn: () => analyticsService.newUsersOverTime(query),
    staleTime: 60 * 1000,
  });
}
