"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productsService } from "@/services";
import type { PaginatedData, Product, ProductListQuery } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

const INFINITE_PAGES = 5;

/**
 * Infinite query for products.
 * Loads pages 1-5 via infinite scroll, then returns totalPages for manual pagination.
 * Accepts optional initialData for SSR hydration.
 */
export function useProductsInfinite(
  baseQuery: ProductListQuery = {},
  initialData?: PaginatedData<Product> | null,
) {
  const query = { limit: APP_CONFIG.defaultPageSize, ...baseQuery };

  const result = useInfiniteQuery({
    queryKey: ["products", "infinite", query],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      productsService.list({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedData<Product>): number | undefined => {
      const nextPage = lastPage.meta.page + 1;
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined;
    },
    staleTime: 60 * 1000,
    ...(initialData
      ? {
          initialData: {
            pages: [initialData],
            pageParams: [1],
          },
        }
      : {}),
  });

  // Flatten all pages into a single items array.
  const allItems = React.useMemo(() => {
    return result.data?.pages.flatMap((p) => p.items) ?? [];
  }, [result.data]);

  // Get the last page's meta for total/totalPages.
  const lastPage = result.data?.pages[result.data.pages.length - 1];
  const totalPages = lastPage?.meta.totalPages ?? 1;
  const total = lastPage?.meta.total ?? 0;
  const currentPage = lastPage?.meta.page ?? 1;

  // Has more pages beyond what infinite scroll loaded?
  const hasMoreInfinite = result.hasNextPage && currentPage < INFINITE_PAGES;

  // Should show pagination? (after 5 pages loaded or no more infinite)
  const showPagination = totalPages > INFINITE_PAGES && !hasMoreInfinite;

  return {
    ...result,
    items: allItems,
    totalPages,
    total,
    currentPage,
    hasMoreInfinite,
    showPagination,
    INFINITE_PAGES,
  };
}
