/**
 * Brands API service (section 3 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Brand } from "@/types/domain";

export interface UpsertBrandBody {
  name: string;
  slug?: string;
  description?: string;
  logoId?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export const brandsService = {
  list: (params?: { includeInactive?: boolean }) =>
    http.get<Brand[]>(ENDPOINTS.brands.list, params),

  bySlug: (slug: string) => http.get<Brand>(ENDPOINTS.brands.bySlug(slug)),

  byId: (id: string) => http.get<Brand>(ENDPOINTS.brands.byId(id)),

  create: (body: UpsertBrandBody) =>
    http.post<Brand>(ENDPOINTS.brands.root, body),

  update: (id: string, body: Partial<UpsertBrandBody>) =>
    http.put<Brand>(ENDPOINTS.brands.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.brands.byId(id)),
};
