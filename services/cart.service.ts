/**
 * Cart API service — IDs are now integers.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Cart, CartResponse } from "@/types/domain";

export const cartService = {
  get: () => http.get<CartResponse>(ENDPOINTS.cart.get),

  addItem: (body: { variantId: number; quantity: number }) =>
    http.post<CartResponse>(ENDPOINTS.cart.addItem, body),

  updateItem: (itemId: number, body: { quantity: number }) =>
    http.patch<CartResponse>(ENDPOINTS.cart.updateItem(itemId), body),

  deleteItem: (itemId: number) =>
    http.delete<CartResponse>(ENDPOINTS.cart.deleteItem(itemId)),

  clear: () => http.delete<CartResponse>(ENDPOINTS.cart.clear),

  merge: (body: { guestToken: string }) =>
    http.post<Cart>(ENDPOINTS.cart.merge, body),
};
