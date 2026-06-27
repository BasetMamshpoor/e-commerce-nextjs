/**
 * Products API service (section 5 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  PaginatedData,
  Product,
  ProductFilterMetadata,
  ProductListQuery,
  ProductStatus,
  ProductVariant,
  ProductImage,
} from "@/types/domain";

export interface CreateProductBody {
  name: string;
  brandId?: string;
  shortDescription?: string;
  description?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  categoryIds: string[];
  images?: Array<{ mediaId: string; order: number; isMain?: boolean }>;
  variants: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    discountType?: "PERCENT" | "FIXED";
    discountValue?: number;
    discountStartAt?: string;
    discountEndAt?: string;
    stock: number;
    isDefault?: boolean;
    attributeValueIds: string[];
  }>;
}

export interface UpdateProductBody {
  name?: string;
  brandId?: string | null;
  shortDescription?: string;
  description?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  categoryIds?: string[];
}

export interface UpdateVariantBody {
  sku?: string;
  price?: number;
  compareAtPrice?: number | null;
  discountType?: "PERCENT" | "FIXED" | null;
  discountValue?: number | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
  stock?: number;
  isDefault?: boolean;
  attributeValueIds?: string[];
}

export const productsService = {
  list: (query?: ProductListQuery) =>
    http.get<PaginatedData<Product>>(ENDPOINTS.products.list, query),

  adminList: (query?: ProductListQuery) =>
    http.get<PaginatedData<Product>>(ENDPOINTS.products.adminList, query),

  adminById: (id: string) =>
    http.get<Product>(ENDPOINTS.products.adminById(id)),

  filters: (categorySlug?: string) =>
    http.get<ProductFilterMetadata>(ENDPOINTS.products.filters, categorySlug ? { categorySlug } : undefined),

  bySlug: (slug: string) =>
    http.get<Product>(ENDPOINTS.products.bySlug(slug)),

  trackView: (id: string) =>
    http.post<void>(ENDPOINTS.products.view(id)),

  create: (body: CreateProductBody) =>
    http.post<Product>(ENDPOINTS.products.root, body),

  update: (id: string, body: UpdateProductBody) =>
    http.put<Product>(ENDPOINTS.products.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.products.byId(id)),

  addVariant: (id: string, body: UpdateVariantBody) =>
    http.post<ProductVariant>(ENDPOINTS.products.variants(id), body),

  updateVariant: (id: string, variantId: string, body: UpdateVariantBody) =>
    http.put<ProductVariant>(ENDPOINTS.products.variant(id, variantId), body),

  deleteVariant: (id: string, variantId: string) =>
    http.delete<void>(ENDPOINTS.products.variant(id, variantId)),

  addVariantImage: (id: string, variantId: string, body: { mediaId: string; order?: number; isMain?: boolean }) =>
    http.post<ProductImage>(ENDPOINTS.products.variantImages(id, variantId), body),

  deleteVariantImage: (id: string, variantId: string, imageId: string) =>
    http.delete<void>(ENDPOINTS.products.variantImage(id, variantId, imageId)),

  addImage: (id: string, body: { mediaId: string; order?: number; isMain?: boolean }) =>
    http.post<ProductImage>(ENDPOINTS.products.images(id), body),

  deleteImage: (id: string, imageId: string) =>
    http.delete<void>(ENDPOINTS.products.image(id, imageId)),
};
