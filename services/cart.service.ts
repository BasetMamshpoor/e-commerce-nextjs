/**
 * Cart API service (section 6 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Cart, CartResponse } from "@/types/domain";

export const cartService = {
  get: () => http.get<Cart>(ENDPOINTS.cart.get),

  addItem: (body: { variantId: string; quantity: number }) =>
    http.post<CartResponse>(ENDPOINTS.cart.addItem, body),

  updateItem: (itemId: string, body: { quantity: number }) =>
    http.patch<CartResponse>(ENDPOINTS.cart.updateItem(itemId), body),

  deleteItem: (itemId: string) =>
    http.delete<CartResponse>(ENDPOINTS.cart.deleteItem(itemId)),

  clear: () => http.delete<CartResponse>(ENDPOINTS.cart.clear),

  merge: (body: { guestToken: string }) =>
    http.post<Cart>(ENDPOINTS.cart.merge, body),
};
