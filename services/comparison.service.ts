/**
 * Comparison API service — SIMPLIFIED.
 * Only GET /?productIds=1,2,3 — no add/remove/clear endpoints.
 * Frontend handles everything via URL.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { ComparisonResponse } from "@/types/domain";

export const comparisonService = {
  get: (productIds: number[]) =>
    http.get<ComparisonResponse>(ENDPOINTS.comparison.get, { productIds: productIds.join(",") }),
};
