"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cartService } from "@/services";
import {
  CART_QUERY_KEY,
  setCartCache,
  captureGuestTokenFromCartResponse,
} from "@/providers/cart-context";
import { getGuestToken, setGuestToken } from "@/lib/api-client";
import type { Cart } from "@/types/domain";
import { ApiError } from "@/types/api";
import { formatToman } from "@/utils/format";

/**
 * Fetch current cart (works for both guest and authenticated users).
 * The axios interceptor auto-injects Authorization + X-Guest-Token headers.
 */
export function useCart() {
  return useQuery<Cart>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const res = await cartService.get();
      // If backend generated a guest token for us, persist it.
      if (res.guestToken && !getGuestToken()) {
        setGuestToken(res.guestToken);
      }
      return res.cart;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Recompute cart totals from items (used by optimistic updates).
 */
function recompute(items: Cart["items"]): Pick<Cart, "itemCount" | "subtotal" | "totalDiscount" | "total"> {
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);
  const subtotal = items.reduce((s, it) => s + it.originalPrice * it.quantity, 0);
  const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  return { itemCount, subtotal, totalDiscount: subtotal - total, total };
}

/**
 * Add a variant to cart. Optimistic: bump quantity locally if item already in cart.
 * Captures guest token if backend assigns a new one.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { variantId: string; quantity?: number }) =>
      cartService.addItem({ variantId: params.variantId, quantity: params.quantity ?? 1 }),
    onMutate: async ({ variantId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (previous) {
        const existing = previous.items.find((it) => it.variantId === variantId);
        if (existing) {
          const items = previous.items.map((it) =>
            it.variantId === variantId
              ? { ...it, quantity: Math.min(it.quantity + (quantity ?? 1), it.availableStock || 99) }
              : it,
          );
          setCartCache(queryClient, { ...previous, items, ...recompute(items) });
        }
      }
      return { previous };
    },
    onSuccess: (res) => {
      captureGuestTokenFromCartResponse(res);
      setCartCache(queryClient, res.cart);
      if (res.wasAdjusted) {
        toast.warning("تعداد درخواستی بیشتر از موجودی بود", {
          description: "تعداد به سقف موجودی کاهش یافت",
        });
      } else {
        toast.success("به سبد خرید اضافه شد");
      }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) setCartCache(queryClient, ctx.previous);
      const apiErr = err as ApiError;
      if (apiErr.isNotFound) {
        toast.error("این تنوع کالا موجود نیست");
      } else if (apiErr.isConflict) {
        toast.error("موجودی کافی نیست", { description: apiErr.message });
      } else {
        toast.error(apiErr.message || "افزودن به سبد ناموفق بود");
      }
    },
  });
}

/**
 * Update quantity of a cart item (0 = remove).
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { itemId: string; quantity: number }) =>
      cartService.updateItem(params.itemId, { quantity: params.quantity }),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (previous) {
        const items =
          quantity <= 0
            ? previous.items.filter((it) => it.id !== itemId)
            : previous.items.map((it) =>
                it.id === itemId
                  ? { ...it, quantity: Math.min(quantity, it.availableStock || 99) }
                  : it,
              );
        setCartCache(queryClient, { ...previous, items, ...recompute(items) });
      }
      return { previous };
    },
    onSuccess: (res) => {
      captureGuestTokenFromCartResponse(res);
      setCartCache(queryClient, res.cart);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) setCartCache(queryClient, ctx.previous);
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "به‌روزرسانی سبد ناموفق بود");
    },
  });
}

/**
 * Remove a single cart item.
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartService.deleteItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (previous) {
        const items = previous.items.filter((it) => it.id !== itemId);
        setCartCache(queryClient, { ...previous, items, ...recompute(items) });
      }
      return { previous };
    },
    onSuccess: (res) => {
      captureGuestTokenFromCartResponse(res);
      setCartCache(queryClient, res.cart);
      toast.success("آیتم از سبد حذف شد");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) setCartCache(queryClient, ctx.previous);
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "حذف از سبد ناموفق بود");
    },
  });
}

/**
 * Clear the entire cart.
 */
export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (res) => {
      captureGuestTokenFromCartResponse(res);
      setCartCache(queryClient, res.cart);
      toast.success("سبد خرید خالی شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "خالی کردن سبد ناموفق بود");
    },
  });
}

/**
 * Merge guest cart into authenticated user's cart after login.
 * Triggered automatically by CartProvider on auth state change.
 */
export function useMergeCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guestToken: string) => cartService.merge({ guestToken }),
    onSuccess: (cart) => {
      setCartCache(queryClient, cart);
    },
    onError: () => {
      // Silent fail.
    },
  });
}

/* ───────── Helpers ───────── */

export function getCartTotals(cart: Cart | undefined) {
  if (!cart) return { itemCount: 0, subtotal: 0, totalDiscount: 0, total: 0 };
  return {
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    totalDiscount: cart.totalDiscount,
    total: cart.total,
  };
}

export function formatCartTotal(amount: number): string {
  return formatToman(amount);
}
