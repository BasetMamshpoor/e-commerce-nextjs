/**
 * Analytics API service (section 23 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  AnalyticsNewUsersPoint,
  AnalyticsOrderStatusBreakdown,
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsSalesPoint,
  AnalyticsTopProduct,
} from "@/types/domain";

export interface DateRangeQuery {
  from?: string; // ISO date
  to?: string;
  period?: AnalyticsPeriod;
}

export const analyticsService = {
  overview: () => http.get<AnalyticsOverview>(ENDPOINTS.analytics.overview),

  salesOverTime: (query?: DateRangeQuery) =>
    http.get<AnalyticsSalesPoint[]>(ENDPOINTS.analytics.salesOverTime, query),

  orderStatusBreakdown: () =>
    http.get<AnalyticsOrderStatusBreakdown[]>(
      ENDPOINTS.analytics.orderStatusBreakdown,
    ),

  topProducts: (query?: { limit?: number; from?: string; to?: string }) =>
    http.get<AnalyticsTopProduct[]>(ENDPOINTS.analytics.topProducts, query),

  newUsersOverTime: (query?: DateRangeQuery) =>
    http.get<AnalyticsNewUsersPoint[]>(
      ENDPOINTS.analytics.newUsersOverTime,
      query,
    ),
};
