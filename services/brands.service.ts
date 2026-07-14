/**
 * Brands API service — logoMediaId instead of logoId.
 *
 * Supports both JSON-only and multipart/form-data requests.
 * For multipart, the logo file is sent under field name "logo".
 */
import { http } from "@/lib/api-client";
import { buildMultipartFormData } from "@/lib/form-data-helper";
import { ENDPOINTS } from "@/api/endpoints";
import type { Brand } from "@/types/domain";

export interface UpsertBrandBody {
  name: string;
  slug?: string;
  description?: string;
  logoMediaId?: number | null;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export const brandsService = {
  list: (params?: { includeInactive?: boolean }) =>
    http.get<Brand[]>(ENDPOINTS.brands.list, params),
  bySlug: (slug: string) => http.get<Brand>(ENDPOINTS.brands.bySlug(slug)),
  byId: (id: number) => http.get<Brand>(ENDPOINTS.brands.byId(id)),
  create: (body: UpsertBrandBody) => http.post<Brand>(ENDPOINTS.brands.create, body),
  update: (id: number, body: Partial<UpsertBrandBody>) =>
    http.put<Brand>(ENDPOINTS.brands.update(id), body),

  /** Create brand with inline logo upload (multipart/form-data, field name: logo). */
  createWithLogo: (body: Omit<UpsertBrandBody, "logoMediaId">, logo?: File) => {
    const fd = buildMultipartFormData(
      body as unknown as Record<string, unknown>,
      logo ? { logo } : undefined,
    );
    return http.upload<Brand>(ENDPOINTS.brands.create, fd);
  },

  /** Update brand with inline logo upload (multipart/form-data, field name: logo). */
  updateWithLogo: (id: number, body: Partial<UpsertBrandBody>, logo?: File) => {
    // If logo is null/undefined we still need to be able to send logoMediaId=null
    // to clear it — so omit the file entirely and send the JSON body.
    if (!logo) {
      return http.put<Brand>(ENDPOINTS.brands.update(id), body);
    }
    const fd = buildMultipartFormData(
      body as unknown as Record<string, unknown>,
      { logo },
    );
    return http.uploadPut<Brand>(ENDPOINTS.brands.update(id), fd);
  },

  delete: (id: number) => http.delete<void>(ENDPOINTS.brands.delete(id)),
};
