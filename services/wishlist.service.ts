/**
 * Wishlist API service (section 7 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { PaginatedData, WishlistItem } from "@/types/domain";

export const wishlistService = {
  list: (params?: { page?: number; limit?: number }) =>
    http.get<PaginatedData<WishlistItem>>(ENDPOINTS.wishlist.list, params),

  add: (productId: string) =>
    http.post<WishlistItem>(ENDPOINTS.wishlist.add, { productId }),

  remove: (productId: string) =>
    http.delete<void>(ENDPOINTS.wishlist.remove(productId)),
};
