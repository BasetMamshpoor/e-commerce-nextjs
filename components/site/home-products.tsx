"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/home-categories-grid";
import { useProducts } from "@/features/catalog/hooks/use-products";

export function HomeFeaturedProducts() {
  const { data, isLoading } = useProducts({ isFeatured: true, limit: 8 });

  return (
    <section className="mb-10" aria-label="محصولات منتخب">
      <SectionHeader
        title="محصولات منتخب"
        href="/products?isFeatured=true"
      />
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : data && data.items.length > 0 ? (
        <ProductGrid products={data.items} />
      ) : (
        <p className="text-sm text-muted-foreground">محصولی یافت نشد.</p>
      )}
    </section>
  );
}

export function HomeDiscountProducts() {
  const { data, isLoading } = useProducts({ hasDiscount: true, limit: 8, sort: "newest" });

  return (
    <section className="mb-10" aria-label="تخفیف‌های ویژه">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            تخفیف‌های ویژه
          </span>
        }
        href="/products?hasDiscount=true"
      />
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : data && data.items.length > 0 ? (
        <ProductGrid products={data.items} />
      ) : (
        <p className="text-sm text-muted-foreground">در حال حاضر تخفیفی موجود نیست.</p>
      )}
    </section>
  );
}

export function ProductGrid({ products }: { products: Parameters<typeof ProductCard>[0]["product"][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
