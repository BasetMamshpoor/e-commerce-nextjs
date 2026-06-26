"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageSearch, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { ProductCard, ProductCardSkeleton } from "@/components/site/product-card";
import { FilterSidebar, MobileFilterSheet } from "@/components/site/filter-sidebar";
import { useProducts } from "@/features/catalog/hooks/use-products";
import { useCategoryBySlug } from "@/features/catalog/hooks/use-categories";
import type { ProductListQuery, ProductSortOption } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";
import { toPersianDigits } from "@/utils/format";

const SORT_LABELS: Record<ProductSortOption, string> = {
  newest: "جدیدترین",
  price_asc: "ارزان‌ترین",
  price_desc: "گران‌ترین",
  popular: "محبوب‌ترین",
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse query params from URL.
  const categorySlugParam = searchParams.get("categorySlug") ?? undefined;
  const brandIdsParam = searchParams.get("brandIds") ?? undefined;
  const attrIdsParam = searchParams.get("attributeValueIds") ?? undefined;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock") === "true";
  const hasDiscountParam = searchParams.get("hasDiscount") === "true";
  const isFeaturedParam = searchParams.get("isFeatured") === "true";
  const searchParam = searchParams.get("search") ?? undefined;
  const sortParam = (searchParams.get("sort") as ProductSortOption) ?? "newest";
  const pageParam = Number(searchParams.get("page") ?? 1);

  const query: ProductListQuery = {
    page: pageParam,
    limit: APP_CONFIG.defaultPageSize,
    categorySlug: categorySlugParam,
    brandIds: brandIdsParam,
    attributeValueIds: attrIdsParam,
    minPrice: minPriceParam ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    inStock: inStockParam || undefined,
    hasDiscount: hasDiscountParam || undefined,
    isFeatured: isFeaturedParam || undefined,
    search: searchParam,
    sort: sortParam,
  };

  const { data, isLoading, isFetching } = useProducts(query);
  const { data: category } = useCategoryBySlug(query.categorySlug);

  const updateSort = (sort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/products?${params.toString()}`, { scroll: true });
  };

  const products = data?.items ?? [];
  const meta = data?.meta;
  const currentPage = meta?.page ?? query.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  // Breadcrumb items.
  const breadcrumbItems = [
    { name: "خانه", url: "/" },
    { name: "محصولات", url: "/products" },
  ];
  if (category) {
    breadcrumbItems.push({
      name: category.name,
      url: `/categories/${category.slug}`,
    });
  }

  // Page title.
  const pageTitle = query.search
    ? `نتایج جست‌وجو: «${query.search}»`
    : category
      ? category.name
      : query.hasDiscount
        ? "محصولات تخفیف‌دار"
        : query.isFeatured
          ? "محصولات منتخب"
          : "همه محصولات";

  return (
    <div className="container-site py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{pageTitle}</h1>
          {meta && (
            <p className="mt-1 text-sm text-muted-foreground">
              {toPersianDigits(meta.total)} کالا
              {query.search && ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MobileFilterSheet categorySlug={query.categorySlug} />
          <Select value={query.sort} onValueChange={(v) => updateSort(v as ProductSortOption)}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <SelectValue placeholder="مرتب‌سازی" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as ProductSortOption[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SORT_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-4">
            <FilterSidebar categorySlug={query.categorySlug} />
          </div>
        </aside>

        {/* Product grid */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-16" />}
              title="محصولی یافت نشد"
              description="با فیلترهای فعلی محصولی پیدا نشد. فیلترها را تغییر دهید یا آنها را پاک کنید."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">حذف فیلترها</Link>
                </Button>
              }
              className="border border-dashed border-border rounded-xl"
            />
          ) : (
            <>
              <div
                className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 ${
                  isFetching ? "opacity-60 transition-opacity" : ""
                }`}
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="صفحه قبل"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    // Show first 3, last 3, and neighbors of current.
                    const page = computePageList(currentPage, totalPages)[i];
                    if (!page) return null;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(page)}
                        className="nums-fa"
                      >
                        {toPersianDigits(page)}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="صفحه بعد"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Build a smart page list: show all if totalPages <= 7, else show 1...current-1, current, current+1...last
 */
function computePageList(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, -1, total]; // -1 = ellipsis placeholder
  if (current >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, -1, current - 1, current, current + 1, -1, total];
}
