"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AuthGuard } from "@/components/common/auth-guard";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { useWishlist, useRemoveFromWishlist } from "@/features/wishlist/hooks";
import { formatTomanShort, formatPrice, toPersianDigits } from "@/utils/format";
import type { WishlistItem } from "@/types/domain";

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}

function WishlistContent() {
  const { data, isLoading } = useWishlist();
  const items = data?.items ?? [];

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "علاقه‌مندی‌ها", url: "/wishlist" },
        ]}
      />

      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        علاقه‌مندی‌های من
        {items.length > 0 && (
          <span className="mr-2 text-sm font-normal text-muted-foreground">
            ({toPersianDigits(items.length)} کالا)
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-16" />}
          title="لیست علاقه‌مندی شما خالی است"
          description="محصولاتی که دوست دارید را به این لیست اضافه کنید تا بعداً راحت‌تر پیدایشان کنید."
          action={
            <Button asChild>
              <Link href="/products">
                مشاهده محصولات
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          }
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const remove = useRemoveFromWishlist();
  const product = item.product;
  const image = product.image;
  const isOutOfStock = !product.isInStock;

  // WishlistItem doesn't include variants; we link to product page for add-to-cart
  // (unless we want to make an extra fetch — keeping it simple here).
  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 z-10 size-8 bg-background/90 text-muted-foreground backdrop-blur hover:text-destructive"
        onClick={() => remove.mutate(product.id)}
        disabled={remove.isPending}
        aria-label="حذف از علاقه‌مندی"
      >
        <Trash2 className="size-4" />
      </Button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ShoppingBag className="size-12 opacity-30" />
            </div>
          )}
          {isOutOfStock && (
            <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              ناموجود
            </span>
          )}
        </div>
      </Link>

      <CardContent className="space-y-2 p-3">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="text-sm font-bold text-foreground nums-fa">
          {product.minPrice === product.maxPrice ? (
            <>{formatTomanShort(product.minPrice)} <span className="text-xs font-normal">تومان</span></>
          ) : (
            <>از {formatPrice(product.minPrice)} <span className="text-xs font-normal">تومان</span></>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-full" disabled={isOutOfStock}>
          <Link href={`/products/${product.slug}`}>
            <ShoppingBag className="size-4" />
            مشاهده و خرید
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
