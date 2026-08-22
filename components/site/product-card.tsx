"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Zap, Heart, Scale } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/site/wishlist-button";
import { ComparisonButton } from "@/components/site/comparison-button";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import {
  discountPercent,
  formatPrice,
  toPersianDigits,
} from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/domain";
import {
  getProductImageAlt,
  getProductImageUrl,
} from "@/types/domain";

interface ProductCardProps {
  product: Product;
  className?: string;
  showAddToCart?: boolean;
  showQuickActions?: boolean;
  /** Compact mode for list view (horizontal layout). */
  variant?: "grid" | "list";
}

export function ProductCard({
  product,
  className,
  showAddToCart = true,
  showQuickActions = true,
  variant = "grid",
}: ProductCardProps) {
  const mainImage = product.images?.find((i) => i.isMain) ?? product.images?.[0];
  const mainImageUrl = mainImage ? getProductImageUrl(mainImage) : "";
  const mainImageAlt = mainImage ? getProductImageAlt(mainImage, product.name) : product.name;
  const minPrice = product.minPrice;
  const maxPrice = product.maxPrice;
  const hasDiscount = product.hasActiveDiscount;
  const isOutOfStock = !product.isInStock;

  // NOTE: minPrice/maxPrice are the range of FINAL (post-discount,
  // post-variant-modifier) prices across variants — they answer "do
  // variants differ in price from each other", which is unrelated to
  // whether a discount is active. Comparing them (maxPrice > minPrice)
  // to decide whether to show a "was" price meant the discount badge/
  // strikethrough never appeared for the very common case of a single
  // variant or uniformly-priced variants, since minPrice === maxPrice
  // there regardless of any active discount. hasActiveDiscount is the
  // actual authoritative flag; basePrice is the real pre-discount
  // reference price.
  const compareAtPrice = hasDiscount && product.basePrice > minPrice ? product.basePrice : null;
  const discountPct = compareAtPrice
    ? discountPercent(compareAtPrice, minPrice)
    : 0;

  const singleVariant = product.variants && product.variants.length === 1
    ? product.variants[0]
    : null;

  if (variant === "list") {
    return (
      <ProductCardList
        product={product}
        mainImageUrl={mainImageUrl}
        mainImageAlt={mainImageAlt}
        minPrice={minPrice}
        maxPrice={maxPrice}
        compareAtPrice={compareAtPrice}
        discountPct={discountPct}
        isOutOfStock={isOutOfStock}
        hasDiscount={hasDiscount}
        singleVariant={singleVariant}
        showQuickActions={showQuickActions}
        showAddToCart={showAddToCart}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(239,58,75,0.08)]",
        className,
      )}
    >
      {/* Image section */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted/50"
        aria-label={product.name}
      >
        {mainImageUrl ? (
          <Image
            src={mainImageUrl}
            alt={mainImageAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/20">
            <ShoppingCart className="size-16" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <span className="flex w-fit items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground shadow-md">
              <Zap className="size-3" />
              ٪{toPersianDigits(discountPct)}
            </span>
          </div>
        )}

        {product.isFeatured && !hasDiscount && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-warning px-2.5 py-1 text-[11px] font-bold text-warning-foreground shadow-md">
              ویژه
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
              ناموجود
            </span>
          </div>
        )}

        {/* Quick actions — visible on mobile, hover-reveal on desktop */}
        {showQuickActions && !isOutOfStock && (
          <div className="absolute left-3 top-3 flex flex-col gap-2 opacity-100 transition-all duration-300 lg:opacity-0 lg:group-hover:opacity-100">
            <WishlistButton
              productId={product.id}
              size="icon"
              variant="secondary"
              className="size-9 rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background"
            />
            <ComparisonButton
              productId={product.id}
              size="icon"
              variant="secondary"
              className="size-9 rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background"
            />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
          >
            {product.brand.name}
          </Link>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-6 text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {product.avgRating != null && product.reviewCount! > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground nums-fa">
              {toPersianDigits(product.avgRating.toFixed(1))}
            </span>
            <span className="text-muted-foreground nums-fa">
              ({toPersianDigits(product.reviewCount!)})
            </span>
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through nums-fa">
                {formatPrice(compareAtPrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground nums-fa">
                {formatPrice(minPrice)}
              </span>
              <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
              {minPrice !== maxPrice && (
                <span className="text-[10px] text-muted-foreground">+</span>
              )}
            </div>
          </div>

          {showAddToCart && !isOutOfStock && (
            singleVariant ? (
              <AddToCartButton
                variantId={singleVariant.id}
                size="icon"
                showIcon
                label=""
                className="size-9 rounded-full shadow-sm"
              />
            ) : (
              <Button asChild variant="default" size="icon" className="size-9 rounded-full shadow-sm">
                <Link href={`/products/${product.slug}`}>
                  <ShoppingCart className="size-4" />
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── List variant ───────── */

function ProductCardList({
  product,
  mainImageUrl,
  mainImageAlt,
  minPrice,
  maxPrice,
  compareAtPrice,
  discountPct,
  isOutOfStock,
  hasDiscount,
  singleVariant,
  showQuickActions,
  showAddToCart,
  className,
}: {
  product: Product;
  mainImageUrl: string;
  mainImageAlt: string;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  discountPct: number;
  isOutOfStock: boolean;
  hasDiscount: boolean;
  singleVariant: import("@/types/domain").ProductVariant | null;
  showQuickActions: boolean;
  showAddToCart: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(239,58,75,0.06)]",
        className,
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted/50 sm:size-32"
      >
        {mainImageUrl ? (
          <Image
            src={mainImageUrl}
            alt={mainImageAlt}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/20">
            <ShoppingCart className="size-8" />
          </div>
        )}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            ٪{toPersianDigits(discountPct)}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-[11px] font-medium text-muted-foreground hover:text-primary"
          >
            {product.brand.name}
          </Link>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary sm:text-base"
        >
          {product.name}
        </Link>

        {product.avgRating != null && product.reviewCount! > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Star className="size-3 fill-warning text-warning" />
            <span className="font-medium nums-fa">{toPersianDigits(product.avgRating.toFixed(1))}</span>
            <span className="text-muted-foreground nums-fa">({toPersianDigits(product.reviewCount!)})</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through nums-fa">
                {formatPrice(compareAtPrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground nums-fa">
                {formatPrice(minPrice)}
              </span>
              <span className="text-[10px] text-muted-foreground">تومان</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showQuickActions && (
              <>
                <WishlistButton productId={product.id} size="icon" variant="ghost" className="size-8" />
                <ComparisonButton productId={product.id} size="icon" variant="ghost" className="size-8" />
              </>
            )}
            {showAddToCart && !isOutOfStock && (
              singleVariant ? (
                <AddToCartButton
                  variantId={singleVariant.id}
                  size="sm"
                  label="افزودن"
                />
              ) : (
                <Button asChild variant="default" size="sm">
                  <Link href={`/products/${product.slug}`}>
                    <ShoppingCart className="size-4" />
                    مشاهده
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="flex gap-4 rounded-2xl border border-border bg-card p-3">
        <Skeleton className="size-28 shrink-0 rounded-xl sm:size-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
