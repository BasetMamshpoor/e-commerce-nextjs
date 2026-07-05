/**
 * Categories API service — IDs are now integers, imageMediaId instead of imageId.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, Category } from "@/types/domain";

export interface UpsertCategoryBody {
  name: string;
  slug?: string;
  description?: string;
  imageMediaId?: number;
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
  delete: (id: number) => http.delete<void>(ENDPOINTS.categories.delete(id)),
  attachAttribute: (id: number, attributeId: number) => http.post<void>(ENDPOINTS.categories.attachAttribute(id), { attributeId }),
  detachAttribute: (id: number, attributeId: number) => http.delete<void>(ENDPOINTS.categories.detachAttribute(id, attributeId)),
};
