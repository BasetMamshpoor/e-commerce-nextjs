/**
 * Discount codes API service (section 9 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { DiscountApplyResult, DiscountCode, PaginatedData } from "@/types/domain";

export interface CreateDiscountCodeBody {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscountAmount?: number | null;
  minCartAmount?: number | null;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  productIds?: string[];
  categoryIds?: string[];
  userIds?: string[];
}

export const discountCodesService = {
  apply: (body: { code: string }) =>
    http.post<DiscountApplyResult>(ENDPOINTS.discountCodes.apply, body),

  list: (params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) =>
    http.get<PaginatedData<DiscountCode>>(ENDPOINTS.discountCodes.list, params),

  byId: (id: string) =>
    http.get<DiscountCode>(ENDPOINTS.discountCodes.byId(id)),

  create: (body: CreateDiscountCodeBody) =>
    http.post<DiscountCode>(ENDPOINTS.discountCodes.root, body),

  update: (id: string, body: Partial<CreateDiscountCodeBody>) =>
    http.put<DiscountCode>(ENDPOINTS.discountCodes.byId(id), body),

  delete: (id: string) =>
    http.delete<void>(ENDPOINTS.discountCodes.byId(id)),
};
