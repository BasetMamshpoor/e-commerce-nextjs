"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersianNumber } from "@/components/common/persian-number";
import { WishlistButton } from "@/components/site/wishlist-button";
import { ComparisonButton } from "@/components/site/comparison-button";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import {
  discountPercent,
  formatPrice,
  formatTomanShort,
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
  /** Show "افزودن به سبد" button on hover. Default: true */
  showAddToCart?: boolean;
  /** Show wishlist + comparison quick actions. Default: true */
  showQuickActions?: boolean;
}

export function ProductCard({
  product,
  className,
  showAddToCart = true,
  showQuickActions = true,
}: ProductCardProps) {
  const mainImage = product.images?.find((i) => i.isMain) ?? product.images?.[0];
  const mainImageUrl = mainImage ? getProductImageUrl(mainImage) : "";
  const mainImageAlt = mainImage ? getProductImageAlt(mainImage, product.name) : product.name;
  const minPrice = product.minPrice;
  const maxPrice = product.maxPrice;
  const hasDiscount = product.hasActiveDiscount;
  const isOutOfStock = !product.isInStock;

  // For "compare at" reference, use the highest price if there's a discount.
  const compareAtPrice = hasDiscount && maxPrice > minPrice ? maxPrice : null;
  const discountPct = compareAtPrice
    ? discountPercent(compareAtPrice, minPrice)
    : 0;

  // For add-to-cart: we don't have variant info on the card listing, so the button
  // links to the product page (where the user picks a variant first).
  // Exception: if the product has only 1 variant, we can add directly.
  const singleVariant = product.variants && product.variants.length === 1
    ? product.variants[0]
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-md",
        className,
      )}
    >
      {/* Quick actions (top-left in RTL) */}
      {showQuickActions && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <WishlistButton
            productId={product.id}
            size="icon"
            variant="secondary"
            className="size-8 bg-background/90 shadow-sm backdrop-blur"
          />
          <ComparisonButton
            productId={product.id}
            size="icon"
            variant="secondary"
            className="size-8 bg-background/90 shadow-sm backdrop-blur"
          />
        </div>
      )}

      {/* Discount / Out-of-stock badge (top-right in RTL) */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        {hasDiscount && discountPct > 0 && (
          <Badge variant="destructive" className="font-bold">
            ٪{formatPrice(discountPct)} تخفیف
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            ناموجود
          </Badge>
        )}
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={product.name}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={mainImageAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="size-12 opacity-30" />
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-1.5 p-3">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="block text-xs text-muted-foreground hover:text-primary"
          >
            {product.brand.name}
          </Link>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {product.ratingAverage != null && product.ratingCount! > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-warning text-warning" />
            <span className="nums-fa">{product.ratingAverage.toFixed(1)}</span>
            <span>({formatPrice(product.ratingCount!)})</span>
          </div>
        )}

        {/* Price */}
        <div className="pt-1">
          {isOutOfStock ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : minPrice === maxPrice ? (
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-foreground nums-fa">
                {formatTomanShort(minPrice)} <span className="text-xs font-normal">تومان</span>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground nums-fa">
                از {formatPrice(minPrice)}
              </div>
              <div className="text-sm font-bold text-foreground nums-fa">
                {formatTomanShort(minPrice)} <span className="text-xs font-normal">تومان</span>
              </div>
            </div>
          )}
          {compareAtPrice && (
            <div className="text-xs text-muted-foreground line-through nums-fa">
              {formatPrice(compareAtPrice)}
            </div>
          )}
        </div>
      </CardContent>

      {showAddToCart && !isOutOfStock && (
        <CardFooter className="p-3 pt-0">
          {singleVariant ? (
            <AddToCartButton
              variantId={singleVariant.id}
              fullWidth
              size="sm"
              label="افزودن به سبد"
            />
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/products/${product.slug}`}>
                <ShoppingCart className="size-4" />
                مشاهده و خرید
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}
