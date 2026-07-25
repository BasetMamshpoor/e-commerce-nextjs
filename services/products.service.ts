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
  PricePreviewBody,
  PricePreviewResponse,
  Product,
  ProductFilterMetadata,
  ProductListQuery,
  ProductPricingMode,
  ProductStatus,
  ProductVariant,
  VariantAttributeValue,
} from "@/types/domain";

export interface CreateProductBody {
  name: string;
  brandId?: number;
  shortDescription?: string;
  description?: string;
  /** Required when pricingMode = FIXED_IRT (>= 1000). Set to 0 when CURRENCY_BASED. */
  basePrice: number;
  /** Pricing mode — FIXED_IRT (default) or CURRENCY_BASED. */
  pricingMode?: ProductPricingMode;
  /** Source currency ID (number, required when CURRENCY_BASED). */
  currencyId?: number;
  /** Price in source currency (required when CURRENCY_BASED, > 0). */
  sourcePrice?: number;
  /** Buffer percentage for price fluctuation (0–100, default 0). */
  priceBufferPercent?: number;
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
    /** New format: attribute values with optional per-variant modifiers. */
    attributeValues: VariantAttributeValue[];
  }>;
  displayAttributes?: Array<{ attributeId: number; value: string }>;
}

export interface UpdateProductBody {
  name?: string;
  brandId?: number | null;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  /** Note: pricingMode is NOT editable after creation (backend rule). */
  currencyId?: number | null;
  sourcePrice?: number;
  priceBufferPercent?: number;
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
  attributeValues?: VariantAttributeValue[];
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

  /** Admin: preview the final price of a product without saving.
   *  Useful for showing the user what the final IRT price will be
   *  before they commit to creating/updating a CURRENCY_BASED product. */
  previewPrice: (body: PricePreviewBody) =>
    http.post<PricePreviewResponse>(ENDPOINTS.products.previewPrice, body),

  addVariant: (id: number, body: UpdateVariantBody) =>
    http.post<ProductVariant>(ENDPOINTS.products.addVariant(id), body),

  updateVariant: (id: number, variantId: number, body: UpdateVariantBody) =>
    http.put<ProductVariant>(ENDPOINTS.products.updateVariant(id, variantId), body),

  deleteVariant: (id: number, variantId: number) =>
    http.delete<void>(ENDPOINTS.products.deleteVariant(id, variantId)),
};
