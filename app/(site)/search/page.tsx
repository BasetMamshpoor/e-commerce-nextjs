"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  FileText,
  FolderTree,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/site/product-card";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { useMainSearch, useGlobalSearch } from "@/features/search/hooks";
import { formatToman, formatPrice, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { MainSearchFilters } from "@/types/domain";

const SORT_OPTIONS = [
  { value: "relevance", label: "مرتبط‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "newest", label: "جدیدترین" },
  { value: "most_popular", label: "محبوب‌ترین" },
  { value: "bestselling", label: "پرفروش‌ترین" },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort") ?? "relevance";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const brandIds = searchParams.get("brandIds") ?? "";
  const categoryIds = searchParams.get("categoryIds") ?? "";
  const inStock = searchParams.get("inStock") === "true";
  const hasDiscount = searchParams.get("hasDiscount") === "true";

  const [inputQ, setInputQ] = React.useState(q);
  React.useEffect(() => setInputQ(q), [q]);

  // Trigger main search only when query length >= 2.
  const enabled = q.trim().length >= 2;
  const { data, isLoading, isFetching } = useMainSearch(
    {
      q,
      page,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brandIds: brandIds || undefined,
      categoryIds: categoryIds || undefined,
      inStock: inStock || undefined,
      hasDiscount: hasDiscount || undefined,
    },
    enabled
  );

  // Also fetch global results (categories, brands, blog posts) for sidebar grouping.
  const { data: globalData } = useGlobalSearch(q, enabled);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const filters = data?.filters;
  const totalPages = meta?.totalPages ?? 1;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!params.has("page")) params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQ.trim()) return;
    updateParams({ q: inputQ.trim(), page: "1" });
  };

  const toggleBrand = (brandId: number) => {
    const ids = brandIds ? brandIds.split(",").map(Number) : [];
    const next = ids.includes(brandId)
      ? ids.filter((x) => x !== brandId)
      : [...ids, brandId];
    updateParams({ brandIds: next.join(",") || null, page: null });
  };

  const toggleFlag = (key: "inStock" | "hasDiscount") => {
    const current = key === "inStock" ? inStock : hasDiscount;
    updateParams({ [key]: current ? null : "true", page: null });
  };

  const selectedBrandIds = brandIds ? brandIds.split(",").map(Number) : [];

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "جستجو", url: "/search" },
          ...(q ? [{ name: `"${q}"`, url: `/search?q=${encodeURIComponent(q)}` }] : []),
        ]}
      />

      {/* Search bar */}
      <div className="mb-6 mt-4">
        <form onSubmit={onSubmit} className="relative max-w-2xl">
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="جستجو در محصولات، دسته‌بندی‌ها، برندها و مقالات..."
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            className="h-12 pr-12 pl-4 text-base"
            autoFocus
          />
          <Button
            type="submit"
            className="absolute left-1.5 top-1.5 h-9"
            disabled={!inputQ.trim()}
          >
            جستجو
          </Button>
        </form>
      </div>

      {!enabled ? (
        <EmptyState
          icon={<SearchIcon className="size-12" />}
          title="عبارت جستجو وارد کنید"
          description="برای جستجو حداقل ۲ کاراکتر وارد کنید."
          className="py-16"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar — filters */}
          <aside className="hidden lg:block">
            <SearchFilters
              filters={filters}
              selectedBrandIds={selectedBrandIds}
              inStock={inStock}
              hasDiscount={hasDiscount}
              minPrice={minPrice ?? ""}
              maxPrice={maxPrice ?? ""}
              onToggleBrand={toggleBrand}
              onToggleFlag={toggleFlag}
              onPriceRange={(min, max) =>
                updateParams({
                  minPrice: min || null,
                  maxPrice: max || null,
                  page: null,
                })
              }
              onClear={() =>
                updateParams({
                  brandIds: null,
                  inStock: null,
                  hasDiscount: null,
                  minPrice: null,
                  maxPrice: null,
                  page: null,
                })
              }
            />
          </aside>

          {/* Results */}
          <div className="space-y-4">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    {meta ? (
                      <>
                        <span className="font-bold text-foreground nums-fa">
                          {toPersianDigits(meta.total)}
                        </span>{" "}
                        نتیجه برای{" "}
                        <span className="font-bold text-foreground">«{q}»</span>
                      </>
                    ) : (
                      <>نتیجه‌ای یافت نشد</>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="size-4" />
                      فیلترها
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>فیلترهای جستجو</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <SearchFilters
                        filters={filters}
                        selectedBrandIds={selectedBrandIds}
                        inStock={inStock}
                        hasDiscount={hasDiscount}
                        minPrice={minPrice ?? ""}
                        maxPrice={maxPrice ?? ""}
                        onToggleBrand={toggleBrand}
                        onToggleFlag={toggleFlag}
                        onPriceRange={(min, max) =>
                          updateParams({
                            minPrice: min || null,
                            maxPrice: max || null,
                            page: null,
                          })
                        }
                        onClear={() =>
                          updateParams({
                            brandIds: null,
                            inStock: null,
                            hasDiscount: null,
                            minPrice: null,
                            maxPrice: null,
                            page: null,
                          })
                        }
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select
                  value={sort}
                  onValueChange={(v) => updateParams({ sort: v, page: null })}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="مرتب‌سازی" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {(selectedBrandIds.length > 0 || inStock || hasDiscount || minPrice || maxPrice) && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedBrandIds.length > 0 &&
                  filters?.brands
                    .filter((b) => selectedBrandIds.includes(b.id))
                    .map((b) => (
                      <Badge key={b.id} variant="secondary" className="gap-1">
                        {b.name}
                        <button
                          onClick={() => toggleBrand(b.id)}
                          className="hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                {inStock && (
                  <Badge variant="secondary" className="gap-1">
                    فقط موجودها
                    <button onClick={() => toggleFlag("inStock")}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge variant="secondary" className="gap-1">
                    تخفیف‌دار
                    <button onClick={() => toggleFlag("hasDiscount")}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {(minPrice || maxPrice) && (
                  <Badge variant="secondary" className="gap-1">
                    {minPrice && maxPrice
                      ? `${toPersianDigits(formatPrice(Number(minPrice)))} - ${toPersianDigits(formatPrice(Number(maxPrice)))}`
                      : minPrice
                      ? `از ${toPersianDigits(formatPrice(Number(minPrice)))}`
                      : `تا ${toPersianDigits(formatPrice(Number(maxPrice)))}`}
                    <button
                      onClick={() =>
                        updateParams({ minPrice: null, maxPrice: null, page: null })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    updateParams({
                      brandIds: null,
                      inStock: null,
                      hasDiscount: null,
                      minPrice: null,
                      maxPrice: null,
                      page: null,
                    })
                  }
                >
                  پاک کردن همه
                </Button>
              </div>
            )}

            {/* Products grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="size-12" />}
                title="نتیجه‌ای یافت نشد"
                description={`برای «${q}» محصولی پیدا نشد. عبارت دیگری را امتحان کنید.`}
                className="py-16"
              />
            ) : (
              <div
                className={cn(
                  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
                  isFetching && "opacity-60"
                )}
              >
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  <ChevronRight className="size-4" />
                  قبلی
                </Button>
                <span className="text-sm text-muted-foreground nums-fa">
                  صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  بعدی
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            )}

            {/* Other results — categories / brands / blog posts */}
            {globalData && (globalData.categories.length > 0 || globalData.brands.length > 0 || globalData.blogPosts.length > 0) && (
              <div className="space-y-4 pt-6">
                {globalData.categories.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <FolderTree className="size-4 text-primary" />
                        دسته‌بندی‌های مرتبط
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {globalData.categories.slice(0, 8).map((c) => (
                          <Link key={c.id} href={`/categories/${c.slug}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              {c.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {globalData.brands.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Tag className="size-4 text-primary" />
                        برندهای مرتبط
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {globalData.brands.slice(0, 8).map((b) => (
                          <Link key={b.id} href={`/brands/${b.slug}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              {b.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {globalData.blogPosts.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <FileText className="size-4 text-primary" />
                        مقالات مرتبط
                      </h3>
                      <div className="space-y-2">
                        {globalData.blogPosts.slice(0, 5).map((p) => (
                          <Link
                            key={p.id}
                            href={`/blog/${p.slug}`}
                            className="block rounded-lg border border-border/40 p-3 transition-colors hover:bg-accent"
                          >
                            <p className="text-sm font-medium text-foreground">{p.title}</p>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Filters Sidebar ───────── */
function SearchFilters({
  filters,
  selectedBrandIds,
  inStock,
  hasDiscount,
  minPrice,
  maxPrice,
  onToggleBrand,
  onToggleFlag,
  onPriceRange,
  onClear,
}: {
  filters?: MainSearchFilters | undefined;
  selectedBrandIds: number[];
  inStock: boolean;
  hasDiscount: boolean;
  minPrice: string;
  maxPrice: string;
  onToggleBrand: (id: number) => void;
  onToggleFlag: (key: "inStock" | "hasDiscount") => void;
  onPriceRange: (min: string, max: string) => void;
  onClear: () => void;
}) {
  const [localMin, setLocalMin] = React.useState(minPrice);
  const [localMax, setLocalMax] = React.useState(maxPrice);
  React.useEffect(() => setLocalMin(minPrice), [minPrice]);
  React.useEffect(() => setLocalMax(maxPrice), [maxPrice]);

  const priceMin = filters?.priceRange?.min ?? 0;
  const priceMax = filters?.priceRange?.max ?? 100000000;

  return (
    <Card className="sticky top-24">
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="size-4" />
            فیلترها
          </h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClear}>
            پاک کردن
          </Button>
        </div>

        <Separator />

        {/* Quick flags */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            موجودی و تخفیف
          </Label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={inStock} onCheckedChange={() => onToggleFlag("inStock")} />
              فقط کالاهای موجود
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={hasDiscount} onCheckedChange={() => onToggleFlag("hasDiscount")} />
              فقط کالاهای تخفیف‌دار
            </label>
          </div>
        </div>

        <Separator />

        {/* Price range */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            بازه قیمت (تومان)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              dir="ltr"
              placeholder={`${priceMin}`}
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="text-left text-xs"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="number"
              dir="ltr"
              placeholder={`${priceMax}`}
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="text-left text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onPriceRange(localMin, localMax)}
          >
            اعمال فیلتر قیمت
          </Button>
        </div>

        {filters && filters.brands.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                برندها
              </Label>
              <div className="max-h-60 space-y-2 overflow-y-auto pl-1">
                {filters.brands.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedBrandIds.includes(b.id)}
                      onCheckedChange={() => onToggleBrand(b.id)}
                    />
                    <span className="truncate">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
