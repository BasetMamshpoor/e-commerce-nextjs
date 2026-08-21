"use client";

// Opt out of static prerendering — page uses useSearchParams.
export const dynamic = "force-dynamic";


import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { useCategoryBySlug } from "@/features/catalog/hooks/use-categories";
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

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: category, isLoading: catLoading } = useCategoryBySlug(slug);

  const brandIdsParam = searchParams.get("brandIds") ?? undefined;
  const attrIdsParam = searchParams.get("attributeValueIds") ?? undefined;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock") === "true";
  const hasDiscountParam = searchParams.get("hasDiscount") === "true";
  const sortParam = (searchParams.get("sort") as ProductSortOption) ?? "newest";
  const pageParam = Number(searchParams.get("page") ?? 1);

  const query: ProductListQuery = {
    categorySlug: slug,
    page: pageParam,
    limit: APP_CONFIG.defaultPageSize,
    brandIds: brandIdsParam,
    attributeValueIds: attrIdsParam,
    minPrice: minPriceParam ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    inStock: inStockParam || undefined,
    hasDiscount: hasDiscountParam || undefined,
    sort: sortParam,
  };

  const { data, isLoading } = useProducts(query);

  const updateSort = (sort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.replace(`/categories/${slug}?${params.toString()}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/categories/${slug}?${params.toString()}`, { scroll: true });
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
          { name: "دسته‌بندی‌ها", url: "/categories" },
          { name: category?.name ?? slug, url: `/categories/${slug}` },
        ]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {catLoading ? "در حال بارگذاری..." : (category?.name ?? "دسته‌بندی")}
          </h1>
          {category?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          )}
          {meta && (
            <p className="mt-1 text-sm text-muted-foreground">
              {toPersianDigits(meta.total)} کالا
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MobileFilterSheet categorySlug={slug} />
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
      </div>

      {/* Subcategories — clicking a category should let you drill further
          down before landing on a product list, not jump straight to
          products. Each of these links to /categories/[child-slug], which
          shows that category's own subcategories in turn (recursive
          browsing via navigation, one level at a time). */}
      {!catLoading && (category?.children?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category!.children!.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-primary"
            >
              {child.imageUrl && (
                <span className="relative size-5 overflow-hidden rounded-full bg-muted">
                  <Image src={child.imageUrl} alt="" fill sizes="20px" className="object-cover" />
                </span>
              )}
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-4">
            <FilterSidebar categorySlug={slug} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-16" />}
              title="محصولی در این دسته یافت نشد"
              description="در حال حاضر محصولی در این دسته‌بندی موجود نیست. بعداً دوباره بررسی کنید."
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

      {category && (
        <JsonLd
          data={collectionPageJsonLd({
            type: "category",
            name: category.name,
            url: `/categories/${slug}`,
            description: category.description ?? undefined,
            imageUrl: category.imageUrl ?? undefined,
          })}
        />
      )}
    </div>
  );
}
