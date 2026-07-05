"use client";

// Opt out of static prerendering — page uses useSearchParams.
export const dynamic = "force-dynamic";


import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

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
import { useBrandBySlug } from "@/features/catalog/hooks/use-brand-by-slug";
import { useProducts } from "@/features/catalog/hooks/use-products";
import { collectionPageJsonLd, JsonLd } from "@/lib/seo";
import type { ProductListQuery, ProductSortOption } from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";
import { toPersianDigits } from "@/utils/format";

const SORT_LABELS: Record<ProductSortOption, string> = {
  newest: "جدیدترین",
  price_asc: "ارزان‌ترین",
  price_desc: "گران‌ترین",
  popular: "محبوب‌ترین",
  bestselling: "پرفروش‌ترین",
  most_viewed: "پربازدیدترین",
  most_popular: "پرمخاطب‌ترین",
};

export default function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: brand, isLoading: brandLoading } = useBrandBySlug(slug);

  // For brand detail page, we filter by brandId via the brandIds param.
  const brandId = brand?.id;
  const sortParam = searchParams.get("sort") as ProductSortOption | null;
  const pageParam = Number(searchParams.get("page") ?? 1);
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock") === "true";
  const hasDiscountParam = searchParams.get("hasDiscount") === "true";

  const query: ProductListQuery = {
    page: pageParam,
    limit: APP_CONFIG.defaultPageSize,
    brandIds: brandId != null ? String(brandId) : undefined,
    minPrice: minPriceParam ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    inStock: inStockParam || undefined,
    hasDiscount: hasDiscountParam || undefined,
    sort: sortParam ?? "newest",
  };

  const { data, isLoading } = useProducts(query);

  const updateSort = (sort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.replace(`/brands/${slug}?${params.toString()}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/brands/${slug}?${params.toString()}`, { scroll: true });
  };

  const products = data?.items ?? [];
  const meta = data?.meta;
  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "برندها", url: "/brands" },
          { name: brand?.name ?? slug, url: `/brands/${slug}` },
        ]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {brandLoading ? "در حال بارگذاری..." : (brand?.name ?? "برند")}
          </h1>
          {brand?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{brand.description}</p>
          )}
          {meta && (
            <p className="mt-1 text-sm text-muted-foreground">
              {toPersianDigits(meta.total)} کالا
            </p>
          )}
        </div>
        <Select value={query.sort} onValueChange={(v) => updateSort(v as ProductSortOption)}>
          <SelectTrigger className="w-[140px] sm:w-[180px]">
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

      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-4">
            <FilterSidebar />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {isLoading || brandLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-16" />}
              title="محصولی برای این برند یافت نشد"
              description="در حال حاضر محصولی برای این برند موجود نیست."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">مشاهده همه محصولات</Link>
                </Button>
              }
              className="border border-dashed border-border rounded-xl"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

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
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={i + 1 === currentPage ? "default" : "outline"}
                      size="icon"
                      onClick={() => goToPage(i + 1)}
                      className="nums-fa"
                    >
                      {toPersianDigits(i + 1)}
                    </Button>
                  ))}
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

      {brand && (
        <JsonLd
          data={collectionPageJsonLd({
            type: "brand",
            name: brand.name,
            url: `/brands/${slug}`,
            description: brand.description ?? undefined,
            imageUrl: brand.logoUrl ?? undefined,
          })}
        />
      )}
    </div>
  );
}
