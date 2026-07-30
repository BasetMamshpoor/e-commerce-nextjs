"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { ProductCard, ProductCardSkeleton } from "@/components/site/product-card";
import { FilterSidebar, MobileFilterSheet } from "@/components/site/filter-sidebar";
import { SortBar } from "@/components/site/sort-bar";
import { Pagination } from "@/components/common/pagination";
import { useProductsInfinite } from "@/features/catalog/hooks/use-products-infinite";
import type { PaginatedData, Product, ProductListQuery, ProductSortOption, Category } from "@/types/domain";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

interface ProductsClientProps {
  initialQuery: ProductListQuery;
  initialProducts: PaginatedData<Product> | null;
  category: Category | null;
}

const INFINITE_PAGES = 5;

export function ProductsClient({
  initialQuery,
  initialProducts,
  category,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Use the query from URL (client-side, for filter changes)
  const query: ProductListQuery = React.useMemo(() => {
    return {
      ...initialQuery,
      categorySlug: searchParams.get("categorySlug") ?? initialQuery.categorySlug,
      brandIds: searchParams.get("brandIds") ?? initialQuery.brandIds,
      attributeValueIds: searchParams.get("attributeValueIds") ?? initialQuery.attributeValueIds,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      inStock: searchParams.get("inStock") === "true" || undefined,
      hasDiscount: searchParams.get("hasDiscount") === "true" || undefined,
      isFeatured: searchParams.get("isFeatured") === "true" || undefined,
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") as ProductSortOption) ?? "newest",
    };
  }, [searchParams, initialQuery]);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalPages,
    total,
    currentPage,
    hasMoreInfinite,
    showPagination,
  } = useProductsInfinite(query, initialProducts);

  // Infinite scroll observer
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMoreInfinite) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreInfinite) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreInfinite, fetchNextPage]);

  const updateSort = (sort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/products?${params.toString()}`, { scroll: true });
  };

  const pageTitle = query.search
    ? `نتایج جست‌وجو: «${query.search}»`
    : category
      ? category.name
      : query.hasDiscount
        ? "محصولات تخفیف‌دار"
        : query.isFeatured
          ? "محصولات منتخب"
          : "همه محصولات";

  const breadcrumbItems = [
    { name: "خانه", url: "/" },
    { name: "محصولات", url: "/products" },
  ];
  if (category) {
    breadcrumbItems.push({ name: category.name, url: `/categories/${category.slug}` });
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{pageTitle}</h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{toPersianDigits(total)} کالا</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MobileFilterSheet categorySlug={query.categorySlug} />
          <SortBar
            value={query.sort ?? "newest"}
            onChange={updateSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-4">
            <FilterSidebar categorySlug={query.categorySlug} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {isLoading && !initialProducts ? (
            <ProductGridSkeleton count={12} variant={viewMode} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-16" />}
              title="محصولی یافت نشد"
              description="با فیلترهای فعلی محصولی پیدا نشد. فیلترها را تغییر دهید یا آنها را پاک کنید."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/products" prefetch>حذف فیلترها</Link>
                </Button>
              }
              className="border border-dashed border-border rounded-xl"
            />
          ) : (
            <>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-3",
                )}
              >
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} variant={viewMode} />
                ))}
              </div>

              {hasMoreInfinite && (
                <div ref={sentinelRef} className="flex items-center justify-center py-8">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      در حال بارگذاری...
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">اسکرول کنید</div>
                  )}
                </div>
              )}

              {showPagination && totalPages > 1 && (
                <Pagination
                  className="mt-8"
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton({ count = 12, variant = "grid" }: { count?: number; variant?: "grid" | "list" }) {
  return (
    <div className={variant === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
