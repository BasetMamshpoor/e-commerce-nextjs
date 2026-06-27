"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Scale, X, ShoppingBag, ArrowLeft, Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import {
  useComparison,
  useRemoveFromComparison,
  useClearComparison,
} from "@/features/comparison/hooks";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import {
  formatToman,
  formatTomanShort,
  formatPrice,
  toPersianDigits,
} from "@/utils/format";
import type { ComparisonItem, Product } from "@/types/domain";
import { getProductImageUrl } from "@/types/domain";

export default function ComparisonPage() {
  const { data: comparison, isLoading } = useComparison();
  const clear = useClearComparison();
  const items = comparison?.items ?? [];

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "مقایسه", url: "/comparison" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          مقایسه محصولات
          {items.length > 0 && (
            <span className="mr-2 text-sm font-normal text-muted-foreground">
              ({toPersianDigits(items.length)} از {toPersianDigits(4)} محصول)
            </span>
          )}
        </h1>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => clear.mutate()}
            disabled={clear.isPending}
          >
            <X className="size-4" />
            خالی کردن لیست
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Scale className="size-16" />}
          title="لیست مقایسه شما خالی است"
          description="حداکثر ۴ محصول را برای مقایسه‌ی ویژگی‌ها به این لیست اضافه کنید."
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
        <ComparisonTable items={items} />
      )}
    </div>
  );
}

function ComparisonTable({ items }: { items: ComparisonItem[] }) {
  const remove = useRemoveFromComparison();

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="w-32 p-3 text-right text-xs font-medium text-muted-foreground">
              ویژگی
            </th>
            {items.map((item) => (
              <th key={item.id} className="p-3 align-top">
                <ComparisonProductHeader
                  item={item}
                  onRemove={() => remove.mutate(item.productId)}
                  removing={remove.isPending}
                />
              </th>
            ))}
            {items.length < 4 && (
              <th className="w-32 p-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/products">
                    <ShoppingBag className="size-4" />
                    افزودن
                  </Link>
                </Button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <ComparisonRow label="قیمت" items={items} render={(p) => {
            if (!p.isInStock) return <span className="text-muted-foreground">—</span>;
            if (p.minPrice === p.maxPrice) return <span className="nums-fa">{formatToman(p.minPrice)}</span>;
            return <span className="nums-fa">از {formatPrice(p.minPrice)} تا {formatPrice(p.maxPrice)}</span>;
          }} />
          <ComparisonRow label="وضعیت موجودی" items={items} render={(p) =>
            p.isInStock ? (
              <span className="flex items-center gap-1 text-success">
                <Check className="size-4" /> موجود
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <Minus className="size-4" /> ناموجود
              </span>
            )
          } />
          <ComparisonRow label="تخفیف" items={items} render={(p) =>
            p.hasActiveDiscount ? (
              <span className="text-success">دارد</span>
            ) : (
              <span className="text-muted-foreground">ندارد</span>
            )
          } />
          <ComparisonRow label="برند" items={items} render={(p) =>
            p.brand ? (
              <Link
                href={`/brands/${p.brand.slug}`}
                className="text-primary hover:underline"
              >
                {p.brand.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          } />
          <ComparisonRow label="دسته‌بندی" items={items} render={(p) =>
            p.categories && p.categories.length > 0 ? (
              <span>{p.categories.map((c) => c.name).join("، ")}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          } />
          <ComparisonRow label="محصول منتخب" items={items} render={(p) =>
            p.isFeatured ? (
              <span className="text-warning">بله</span>
            ) : (
              <span className="text-muted-foreground">خیر</span>
            )
          } />

          {/* Variants (if available) */}
          <ComparisonRow
            label="تنوع‌ها"
            items={items}
            render={(p) => (
              <span className="nums-fa">{toPersianDigits(p.variants?.length ?? 0)} تنوع</span>
            )}
          />

          {/* Add-to-cart row */}
          <tr className="border-t border-border/60">
            <td className="p-3 text-xs font-medium text-muted-foreground">عملیات</td>
            {items.map((item) => {
              const singleVariant = item.product.variants && item.product.variants.length === 1
                ? item.product.variants[0]
                : null;
              return (
                <td key={item.id} className="p-3">
                  {singleVariant && !singleVariant.stock ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      ناموجود
                    </Button>
                  ) : singleVariant ? (
                    <AddToCartButton
                      variantId={singleVariant.id}
                      fullWidth
                      size="sm"
                      label="افزودن به سبد"
                    />
                  ) : (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/products/${item.product.slug}`}>مشاهده</Link>
                    </Button>
                  )}
                </td>
              );
            })}
            {items.length < 4 && <td />}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ComparisonProductHeader({
  item,
  onRemove,
  removing,
}: {
  item: ComparisonItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const p = item.product;
  const mainImage = p.images?.find((i) => i.isMain) ?? p.images?.[0];

  return (
    <div className="space-y-2 text-center">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={removing}
        aria-label="حذف از مقایسه"
      >
        <X className="size-4" />
      </Button>
      <Link
        href={`/products/${p.slug}`}
        className="relative block aspect-square w-full overflow-hidden rounded-lg bg-muted"
      >
        {mainImage ? (
          <Image
            src={getProductImageUrl(mainImage)}
            alt={p.name}
            fill
            sizes="200px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-8 opacity-30" />
          </div>
        )}
      </Link>
      <Link
        href={`/products/${p.slug}`}
        className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
      >
        {p.name}
      </Link>
    </div>
  );
}

function ComparisonRow({
  label,
  items,
  render,
}: {
  label: string;
  items: ComparisonItem[];
  render: (product: Product) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-border/40">
      <td className="bg-muted/30 p-3 text-xs font-medium text-muted-foreground">
        {label}
      </td>
      {items.map((item) => (
        <td key={item.id} className="p-3 text-center text-sm">
          {render(item.product)}
        </td>
      ))}
      {items.length < 4 && <td className="bg-muted/20" />}
    </tr>
  );
}
