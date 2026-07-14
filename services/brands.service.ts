/**
 * Brands API service — logoMediaId instead of logoId.
 */
import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Brand } from "@/types/domain";

export interface UpsertBrandBody {
  name: string; slug?: string; description?: string;
  logoMediaId?: number | null; isActive?: boolean;
  metaTitle?: string; metaDescription?: string;
}

export const brandsService = {
  list: (params?: { includeInactive?: boolean }) => http.get<Brand[]>(ENDPOINTS.brands.list, params),
  bySlug: (slug: string) => http.get<Brand>(ENDPOINTS.brands.bySlug(slug)),
  byId: (id: number) => http.get<Brand>(ENDPOINTS.brands.byId(id)),
  create: (body: UpsertBrandBody) => http.post<Brand>(ENDPOINTS.brands.create, body),
  update: (id: number, body: Partial<UpsertBrandBody>) => http.put<Brand>(ENDPOINTS.brands.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.brands.delete(id)),
};
