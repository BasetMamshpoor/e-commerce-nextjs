/**
 * Products API service — REWRITTEN for new API structure.
 * Key changes: basePrice + priceAdjustment, discount at product level,
 * no separate image endpoints, no POST /:id/view.
 */

import { http } from "@/lib/api-client";
import { buildMultipartFormData } from "@/lib/form-data-helper";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  PaginatedData,
  Product,
  ProductFilterMetadata,
  ProductListQuery,
  ProductStatus,
  ProductVariant,
} from "@/types/domain";

export interface CreateProductBody {
  name: string;
  brandId?: number;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  categoryIds: number[];
  images?: Array<{ mediaId: number; order: number; isMain?: boolean }>;
  variants: Array<{
    sku: string;
    priceAdjustment: number;
    stock: number;
    weight?: number;
    isDefault?: boolean;
    isActive?: boolean;
    attributeValueIds: number[];
  }>;
  displayAttributes?: Array<{ attributeId: number; value: string }>;
}

export interface UpdateProductBody {
  name?: string;
  brandId?: number | null;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  discountType?: "PERCENT" | "FIXED" | null;
  discountValue?: number | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  categoryIds?: number[];
  /** New images to add — referenced by mediaId (selected from gallery).
   *  New uploaded FILES go via multipart field "images" (separate from this). */
  images?: Array<{ mediaId: number; order: number; isMain: boolean }>;
  /** IDs of existing ProductImages to delete. */
  deletedImages?: number[];
  displayAttributes?: Array<{ attributeId: number; value: string }>;
}

export interface UpdateVariantBody {
  sku?: string;
  priceAdjustment?: number;
  stock?: number;
  weight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  attributeValueIds?: number[];
}

export const productsService = {
  list: (query?: ProductListQuery) =>
    http.get<PaginatedData<Product>>(ENDPOINTS.products.list, query),

  adminList: (query?: ProductListQuery) =>
    http.get<PaginatedData<Product>>(ENDPOINTS.products.adminList, query),

  adminById: (id: number) =>
    http.get<Product>(ENDPOINTS.products.adminById(id)),

  filters: (categorySlug?: string) =>
    http.get<ProductFilterMetadata>(ENDPOINTS.products.filters, categorySlug ? { categorySlug } : undefined),

  bySlug: (slug: string) =>
    http.get<Product>(ENDPOINTS.products.bySlug(slug)),

  byId: (id: number) =>
    http.get<Product>(ENDPOINTS.products.byId(id)),

  create: (body: CreateProductBody) =>
    http.post<Product>(ENDPOINTS.products.create, body),

  /** Update product — supports JSON-only or multipart (for inline image upload). */
  update: (id: number, body: UpdateProductBody) =>
    http.put<Product>(ENDPOINTS.products.update(id), body),

  /** Create product with inline images (multipart/form-data).
   * Uses bracket notation for arrays (Express/multer standard):
   *   categoryIds[]=7, variants[0][sku]=..., images=<file>
   */
  createWithImages: (body: CreateProductBody, images: File[]) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { images });
    return http.upload<Product>(ENDPOINTS.products.create, fd);
  },

  /** Update product with inline images (multipart/form-data, PUT method). */
  updateWithImages: (id: number, body: UpdateProductBody, images: File[]) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { images });
    return http.uploadPut<Product>(ENDPOINTS.products.update(id), fd);
  },

  delete: (id: number) =>
    http.delete<void>(ENDPOINTS.products.delete(id)),

  addVariant: (id: number, body: UpdateVariantBody) =>
    http.post<ProductVariant>(ENDPOINTS.products.addVariant(id), body),

  updateVariant: (id: number, variantId: number, body: UpdateVariantBody) =>
    http.put<ProductVariant>(ENDPOINTS.products.updateVariant(id, variantId), body),

  deleteVariant: (id: number, variantId: number) =>
    http.delete<void>(ENDPOINTS.products.deleteVariant(id, variantId)),
};
