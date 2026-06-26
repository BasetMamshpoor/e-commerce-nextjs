/**
 * Shipping companies API service (section 11 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { ShippingCompany } from "@/types/domain";

export interface UpsertShippingCompanyBody {
  name: string;
  logoId?: string;
  description?: string;
  baseCost: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

export const shippingCompaniesService = {
  list: (params?: { includeInactive?: boolean }) =>
    http.get<ShippingCompany[]>(ENDPOINTS.shippingCompanies.list, params),

  byId: (id: string) =>
    http.get<ShippingCompany>(ENDPOINTS.shippingCompanies.byId(id)),

  create: (body: UpsertShippingCompanyBody) =>
    http.post<ShippingCompany>(ENDPOINTS.shippingCompanies.root, body),

  update: (id: string, body: Partial<UpsertShippingCompanyBody>) =>
    http.put<ShippingCompany>(ENDPOINTS.shippingCompanies.byId(id), body),

  delete: (id: string) =>
    http.delete<void>(ENDPOINTS.shippingCompanies.byId(id)),
};
