"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { wishlistService } from "@/services";
import { useAuth } from "@/providers/auth-context";
import { ApiError } from "@/types/api";
import type { PaginatedData, WishlistItem } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

export const WISHLIST_QUERY_KEY = ["wishlist"] as const;

/**
 * Fetch the user's wishlist (paginated). Returns first page only for badge count.
 */
export function useWishlist(page = 1, limit = 50) {
  const { isAuthenticated } = useAuth();
  return useQuery<PaginatedData<WishlistItem>>({
    queryKey: [...WISHLIST_QUERY_KEY, page, limit],
    queryFn: () => wishlistService.list({ page, limit }),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * List of product IDs in wishlist (for "is this product in wishlist?" checks).
 */
export function useWishlistProductIds() {
  const { data } = useWishlist();
  return new Set(data?.items.map((w) => w.productId) ?? []);
}

/**
 * Add a product to wishlist. Idempotent per api.md.
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.add(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedData<WishlistItem>>([
        ...WISHLIST_QUERY_KEY,
        1,
        50,
      ]);
      // Optimistic: only add if not already present.
      if (previous && !previous.items.some((w) => w.productId === productId)) {
        const optimistic: PaginatedData<WishlistItem> = {
          items: [
            {
              id: -Date.now(),
              productId,
              product: {
                id: productId,
                name: "",
                slug: "",
                minPrice: 0,
                maxPrice: 0,
                isInStock: false,
                hasActiveDiscount: false,
              },
              createdAt: new Date().toISOString(),
            },
            ...previous.items,
          ],
          meta: { ...previous.meta, total: previous.meta.total + 1 },
        };
        queryClient.setQueryData([...WISHLIST_QUERY_KEY, 1, 50], optimistic);
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("به علاقه‌مندی‌ها اضافه شد");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([...WISHLIST_QUERY_KEY, 1, 50], ctx.previous);
      }
      const apiErr = err as ApiError;
      if (apiErr.isUnauthorized) {
        toast.error("برای افزودن به علاقه‌مندی باید وارد شوید");
      } else {
        toast.error(apiErr.message || "افزودن به علاقه‌مندی ناموفق بود");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
  });
}

/**
 * Remove a product from wishlist.
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.remove(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedData<WishlistItem>>([
        ...WISHLIST_QUERY_KEY,
        1,
        50,
      ]);
      if (previous) {
        const optimistic: PaginatedData<WishlistItem> = {
          items: previous.items.filter((w) => w.productId !== productId),
          meta: { ...previous.meta, total: Math.max(0, previous.meta.total - 1) },
        };
        queryClient.setQueryData([...WISHLIST_QUERY_KEY, 1, 50], optimistic);
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("از علاقه‌مندی‌ها حذف شد");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([...WISHLIST_QUERY_KEY, 1, 50], ctx.previous);
      }
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "حذف از علاقه‌مندی ناموفق بود");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
  });
}

/**
 * Toggle a product in/out of wishlist. Returns the new state.
 */
export function useWishlistToggle() {
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();
  const ids = useWishlistProductIds();

  return {
    isPending: add.isPending || remove.isPending,
    isInWishlist: (productId: number) => ids.has(productId),
    toggle: (productId: number) => {
      if (ids.has(productId)) remove.mutate(productId);
      else add.mutate(productId);
    },
  };
}
