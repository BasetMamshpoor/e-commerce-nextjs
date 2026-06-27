"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { comparisonService } from "@/services";
import { ApiError } from "@/types/api";
import { getGuestToken, setGuestToken } from "@/lib/api-client";
import type { ComparisonResponse } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

export const COMPARISON_QUERY_KEY = ["comparison"] as const;

/**
 * Fetch the current comparison list (guest or authenticated).
 * Captures guest token if backend assigns a new one.
 */
export function useComparison() {
  return useQuery<ComparisonResponse["comparison"]>({
    queryKey: COMPARISON_QUERY_KEY,
    queryFn: async () => {
      const res = await comparisonService.get();
      if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
      return res.comparison;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * List of product IDs in comparison (for "is this product in comparison?" checks).
 */
export function useComparisonProductIds() {
  const { data } = useComparison();
  return new Set(data?.items.map((c) => c.productId) ?? []);
}

/**
 * Add a product to comparison. Max 4 items per api.md.
 */
export function useAddToComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => comparisonService.add(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: COMPARISON_QUERY_KEY });
      const previous = queryClient.getQueryData<ComparisonResponse["comparison"]>(COMPARISON_QUERY_KEY);
      if (previous && !previous.items.some((c) => c.productId === productId)) {
        if (previous.items.length >= APP_CONFIG.comparisonMaxItems) {
          // Don't optimistically add — let backend reject.
          return { previous };
        }
        const optimistic = {
          ...previous,
          items: [
            ...previous.items,
            {
              id: `optimistic-${productId}`,
              productId,
              product: {
                id: productId,
                name: "",
                slug: "",
                minPrice: 0,
                maxPrice: 0,
                isInStock: false,
                hasActiveDiscount: false,
              } as any,
            },
          ],
        };
        queryClient.setQueryData(COMPARISON_QUERY_KEY, optimistic);
      }
      return { previous };
    },
    onSuccess: (res) => {
      if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
      queryClient.setQueryData(COMPARISON_QUERY_KEY, res.comparison);
      toast.success("به لیست مقایسه اضافه شد");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(COMPARISON_QUERY_KEY, ctx.previous);
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("حداکثر ۴ محصول قابل مقایسه است", {
          description: "ابتدا یک محصول را از لیست مقایسه حذف کنید",
        });
      } else {
        toast.error(apiErr.message || "افزودن به مقایسه ناموفق بود");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMPARISON_QUERY_KEY });
    },
  });
}

/**
 * Remove a product from comparison.
 */
export function useRemoveFromComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => comparisonService.remove(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: COMPARISON_QUERY_KEY });
      const previous = queryClient.getQueryData<ComparisonResponse["comparison"]>(COMPARISON_QUERY_KEY);
      if (previous) {
        const optimistic = {
          ...previous,
          items: previous.items.filter((c) => c.productId !== productId),
        };
        queryClient.setQueryData(COMPARISON_QUERY_KEY, optimistic);
      }
      return { previous };
    },
    onSuccess: (res) => {
      if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
      queryClient.setQueryData(COMPARISON_QUERY_KEY, res.comparison);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(COMPARISON_QUERY_KEY, ctx.previous);
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "حذف از مقایسه ناموفق بود");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMPARISON_QUERY_KEY });
    },
  });
}

/**
 * Clear the entire comparison list.
 */
export function useClearComparison() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => comparisonService.clear(),
    onSuccess: (res) => {
      if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
      queryClient.setQueryData(COMPARISON_QUERY_KEY, res.comparison);
      toast.success("لیست مقایسه خالی شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "خالی کردن مقایسه ناموفق بود");
    },
  });
}

/**
 * Toggle a product in/out of comparison. Returns current state helpers.
 */
export function useComparisonToggle() {
  const add = useAddToComparison();
  const remove = useRemoveFromComparison();
  const ids = useComparisonProductIds();

  return {
    isPending: add.isPending || remove.isPending,
    isInComparison: (productId: string) => ids.has(productId),
    toggle: (productId: string) => {
      if (ids.has(productId)) remove.mutate(productId);
      else add.mutate(productId);
    },
  };
}
