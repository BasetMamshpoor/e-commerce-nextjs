/**
 * Comparison API service (section 8 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { ComparisonResponse } from "@/types/domain";

export const comparisonService = {
  get: () => http.get<ComparisonResponse>(ENDPOINTS.comparison.get),

  add: (productId: string) =>
    http.post<ComparisonResponse>(ENDPOINTS.comparison.add, { productId }),

  remove: (productId: string) =>
    http.delete<ComparisonResponse>(ENDPOINTS.comparison.remove(productId)),

  clear: () => http.delete<ComparisonResponse>(ENDPOINTS.comparison.clear),
};
