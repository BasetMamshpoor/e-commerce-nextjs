"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Zap } from "lucide-react";

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
  formatTomanShort,
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

  const compareAtPrice = hasDiscount && maxPrice > minPrice ? maxPrice : null;
  const discountPct = compareAtPrice
    ? discountPercent(compareAtPrice, minPrice)
    : 0;

  const singleVariant = product.variants && product.variants.length === 1
    ? product.variants[0]
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/40 card-hover",
        className,
      )}
    >
      {/* Quick actions */}
      {showQuickActions && (
        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
          <WishlistButton
            productId={product.id}
            size="icon"
            variant="secondary"
            className="size-8 glass shadow-sm"
          />
          <ComparisonButton
            productId={product.id}
            size="icon"
            variant="secondary"
            className="size-8 glass shadow-sm"
          />
        </div>
      )}

      {/* Badges */}
      <div className="absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
        {hasDiscount && discountPct > 0 && (
          <Badge className="bg-destructive text-destructive-foreground shadow-sm">
            <Zap className="size-3" />
            ٪{toPersianDigits(discountPct)}
          </Badge>
        )}
        {product.isFeatured && !hasDiscount && (
          <Badge className="bg-warning text-warning-foreground shadow-sm">
            ویژه
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="secondary" className="glass shadow-sm">
            ناموجود
          </Badge>
        )}
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="block"
        aria-label={product.name}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={mainImageAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/30">
              <ShoppingCart className="size-14" />
            </div>
          )}
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>

      <CardContent className="space-y-1.5 p-3">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
          >
            {product.brand.name}
          </Link>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {product.ratingAverage != null && product.ratingCount! > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="size-3 fill-warning text-warning" />
            <span className="font-medium text-foreground nums-fa">
              {toPersianDigits(product.ratingAverage.toFixed(1))}
            </span>
            <span className="text-muted-foreground nums-fa">
              ({toPersianDigits(product.ratingCount!)})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="pt-1.5">
          {isOutOfStock ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <div className="space-y-0.5">
              {compareAtPrice && (
                <p className="text-xs text-muted-foreground line-through nums-fa">
                  {formatPrice(compareAtPrice)}
                </p>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-foreground nums-fa">
                  {formatTomanShort(minPrice)}
                </span>
                <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                {minPrice !== maxPrice && (
                  <span className="text-[10px] text-muted-foreground">+</span>
                )}
              </div>
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
            <Button asChild variant="outline" size="sm" className="w-full group/btn">
              <Link href={`/products/${product.slug}`}>
                <ShoppingCart className="size-4 transition-transform group-hover/btn:scale-110" />
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
    <Card className="overflow-hidden border-border/40">
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
