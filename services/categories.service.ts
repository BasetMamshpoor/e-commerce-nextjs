/**
 * Categories API service — IDs are now integers, imageMediaId instead of imageId.
 *
 * Supports both JSON-only and multipart/form-data requests.
 * For multipart, the image file is sent under field name "image"
 * (matches backend entityUpload("category")).
 */

import { http } from "@/lib/api-client";
import { buildMultipartFormData } from "@/lib/form-data-helper";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, Category } from "@/types/domain";

export interface UpsertCategoryBody {
  name: string;
  slug?: string;
  description?: string;
  imageMediaId?: number | null;
  parentId?: number;
  order?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export const categoriesService = {
  tree: () => http.get<Category[]>(ENDPOINTS.categories.tree),
  list: (params?: { includeInactive?: boolean }) => http.get<Category[]>(ENDPOINTS.categories.list, params),
  bySlug: (slug: string) => http.get<Category>(ENDPOINTS.categories.bySlug(slug)),
  byId: (id: number) => http.get<Category>(ENDPOINTS.categories.byId(id)),
  attributes: (id: number) => http.get<Attribute[]>(ENDPOINTS.categories.attributes(id)),
  create: (body: UpsertCategoryBody) => http.post<Category>(ENDPOINTS.categories.create, body),
  update: (id: number, body: Partial<UpsertCategoryBody>) => http.put<Category>(ENDPOINTS.categories.update(id), body),

  /** Create category with inline image upload (multipart/form-data, field name: image). */
  createWithImage: (body: Omit<UpsertCategoryBody, "imageMediaId">, image?: File) => {
    const fd = buildMultipartFormData(
      body as unknown as Record<string, unknown>,
      image ? { image } : undefined,
    );
    return http.upload<Category>(ENDPOINTS.categories.create, fd);
  },

  /** Update category with inline image upload (multipart/form-data, field name: image). */
  updateWithImage: (id: number, body: Partial<UpsertCategoryBody>, image?: File) => {
    if (!image) {
      return http.put<Category>(ENDPOINTS.categories.update(id), body);
    }
    const fd = buildMultipartFormData(
      body as unknown as Record<string, unknown>,
      { image },
    );
    return http.uploadPut<Category>(ENDPOINTS.categories.update(id), fd);
  },

  delete: (id: number) => http.delete<void>(ENDPOINTS.categories.delete(id)),
  attachAttribute: (id: number, attributeId: number) => http.post<void>(ENDPOINTS.categories.attachAttribute(id), { attributeId }),
  detachAttribute: (id: number, attributeId: number) => http.delete<void>(ENDPOINTS.categories.detachAttribute(id, attributeId)),
};
