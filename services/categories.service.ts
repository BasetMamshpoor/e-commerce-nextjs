/**
 * Categories API service (section 2 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, Category } from "@/types/domain";

export interface UpsertCategoryBody {
  name: string;
  slug?: string;
  description?: string;
  imageId?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export const categoriesService = {
  tree: () => http.get<Category[]>(ENDPOINTS.categories.tree),

  list: (params?: { includeInactive?: boolean }) =>
    http.get<Category[]>(ENDPOINTS.categories.list, params),

  bySlug: (slug: string) =>
    http.get<Category>(ENDPOINTS.categories.bySlug(slug)),

  byId: (id: string) =>
    http.get<Category>(ENDPOINTS.categories.byId(id)),

  attributes: (id: string) =>
    http.get<Attribute[]>(ENDPOINTS.categories.attributes(id)),

  create: (body: UpsertCategoryBody) =>
    http.post<Category>(ENDPOINTS.categories.root, body),

  update: (id: string, body: Partial<UpsertCategoryBody>) =>
    http.put<Category>(ENDPOINTS.categories.byId(id), body),

  delete: (id: string) =>
    http.delete<void>(ENDPOINTS.categories.byId(id)),

  attachAttribute: (id: string, attributeId: string) =>
    http.post<void>(ENDPOINTS.categories.attachAttribute(id), { attributeId }),

  detachAttribute: (id: string, attributeId: string) =>
    http.delete<void>(ENDPOINTS.categories.detachAttribute(id, attributeId)),
};
