"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Share2,
  Minus,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { ProductCard } from "@/components/site/product-card";
import { WishlistButton } from "@/components/site/wishlist-button";
import { ComparisonButton } from "@/components/site/comparison-button";
import { CommentSection } from "@/features/comments/components/comment-section";
import { useProductBySlug } from "@/features/catalog/hooks/use-product-by-slug";
import { useProducts } from "@/features/catalog/hooks/use-products";
import { useAddToCart } from "@/features/cart/hooks";
import { productsService } from "@/services";
import { productJsonLd, JsonLd } from "@/lib/seo";
import {
  discountPercent,
  formatPrice,
  toPersianDigits,
} from "@/utils/format";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/domain";
import {
  getProductCategories,
  getProductImageAlt,
  getProductImageUrl,
  getVariantAttributeValues,
  type Product as ProductType,
  type ProductImage,
} from "@/types/domain";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const { data: product, isLoading } = useProductBySlug(slug);

  // Find default variant or first available.
  const variants = product?.variants ?? [];
  const defaultVariant =
    variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(defaultVariant);

  // Reset selected variant when product changes.
  React.useEffect(() => {
    if (!product) return;
    const v = product.variants ?? [];
    const def = v.find((x) => x.isDefault) ?? v[0] ?? null;
    setSelectedVariant(def);
  }, [product?.id, product]);

  // Track view on mount (best-effort).
  React.useEffect(() => {
    if (product?.id) {
      productsService.trackView(product.id).catch(() => {});
    }
  }, [product?.id]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container-site py-12">
        <EmptyState
          title="محصول پیدا نشد"
          description="محصول موردنظر وجود ندارد یا حذف شده است."
          action={
            <Button asChild>
              <Link href="/products">بازگشت به فروشگاه</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const categories = getProductCategories(product);
  const breadcrumbItems = [
    { name: "خانه", url: "/" },
    { name: "محصولات", url: "/products" },
  ];
  if (categories[0]) {
    breadcrumbItems.push({
      name: categories[0].name,
      url: `/categories/${categories[0].slug}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: `/products/${product.slug}`,
  });

  return (
    <div className="container-site py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Gallery (left in LTR → right in RTL) */}
        <div className="lg:col-span-5">
          <ProductGallery images={product.images ?? []} name={product.name} />
        </div>

        {/* Info */}
        <div className="lg:col-span-4">
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
          />
        </div>

        {/* Buy box */}
        <div className="lg:col-span-3">
          <BuyBox
            product={product}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      {/* Tabs: description / specs / shipping */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">توضیحات</TabsTrigger>
            <TabsTrigger value="specs">مشخصات</TabsTrigger>
            <TabsTrigger value="shipping">ارسال و مرجوعی</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <ProductDescription html={product.description} />
          </TabsContent>
          <TabsContent value="specs" className="mt-4">
            <ProductSpecs variant={selectedVariant} categories={categories} brand={product.brand ?? null} />
          </TabsContent>
          <TabsContent value="shipping" className="mt-4">
            <ShippingInfo />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related products */}
      <RelatedProducts product={product} />

      {/* Comments & reviews */}
      <CommentSection productId={product.id} productName={product.name} />

      {/* Product structured data */}
      <JsonLd data={productJsonLd(product)} />
    </div>
  );
}

/* ───────── Gallery ───────── */

function ProductGallery({
  images,
  name,
}: {
  images: NonNullable<ProductDetailProduct["images"]>;
  name: string;
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const mainImage = images[activeIdx];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted">
        <ShoppingCart className="size-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-card border border-border/60">
        {mainImage && (
          <Image
            src={getProductImageUrl(mainImage) || "/placeholder.svg"}
            alt={getProductImageAlt(mainImage, name)}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => {
            const url = getProductImageUrl(img);
            if (!url) return null;
            return (
              <button
                key={img.id}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border-2 bg-card transition-all",
                  i === activeIdx
                    ? "border-primary"
                    : "border-transparent hover:border-border",
                )}
                aria-label={`تصویر ${i + 1}`}
              >
                <Image
                  src={url}
                  alt={getProductImageAlt(img, name)}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────── Info ───────── */

type ProductDetailProduct = NonNullable<Awaited<ReturnType<typeof import("@/services").productsService.bySlug>>>;

function ProductInfo({
  product,
  selectedVariant,
  onSelectVariant,
}: {
  product: ProductDetailProduct;
  selectedVariant: ProductVariant | null;
  onSelectVariant: (v: ProductVariant) => void;
}) {
  // Group attribute values by attribute for variant picker display.
  const variantAttributes = React.useMemo(() => {
    if (!selectedVariant) return [];
    return getVariantAttributeValues(selectedVariant);
  }, [selectedVariant]);

  return (
    <div className="space-y-4">
      {product.brand && (
        <Link
          href={`/brands/${product.brand.slug}`}
          className="inline-block text-sm text-primary hover:underline"
        >
          {product.brand.name}
        </Link>
      )}
      <h1 className="text-lg font-bold leading-tight text-foreground sm:text-2xl">
        {product.name}
      </h1>

      {product.shortDescription && (
        <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
      )}

      {/* Rating */}
      {product.ratingAverage != null && product.ratingCount! > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < Math.round(product.ratingAverage!)
                    ? "fill-warning text-warning"
                    : "fill-muted text-muted",
                )}
              />
            ))}
          </div>
          <span className="nums-fa font-medium text-foreground">
            {product.ratingAverage.toFixed(1)}
          </span>
          <span className="text-muted-foreground">
            ({toPersianDigits(product.ratingCount!)} نظر)
          </span>
        </div>
      )}

      <Separator />

      {/* Variant picker */}
      {product.variants && product.variants.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">انتخاب گزینه:</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const avs = getVariantAttributeValues(v);
              const label = avs.length > 0
                ? avs.map((av) => av.value).join("، ")
                : v.sku;
              const isSelected = selectedVariant?.id === v.id;
              const isOutOfStock = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVariant(v)}
                  disabled={isOutOfStock}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40",
                    isOutOfStock && "opacity-50 line-through",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected variant attributes label */}
      {selectedVariant && variantAttributes.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">ویژگی‌های تنوع انتخاب‌شده:</p>
          <ul className="mt-1 space-y-0.5">
            {variantAttributes.map((av) => (
              <li key={av.id} className="flex items-center gap-2">
                <span className="text-foreground">{av.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ───────── Buy Box ───────── */

function BuyBox({
  product,
  selectedVariant,
}: {
  product: ProductDetailProduct;
  selectedVariant: ProductVariant | null;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const addToCart = useAddToCart();

  // Reset quantity when variant changes.
  React.useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  if (!selectedVariant) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4 text-center text-sm text-muted-foreground">
        تنوعی برای انتخاب موجود نیست.
      </div>
    );
  }

  const originalPrice = selectedVariant.compareAtPrice ?? selectedVariant.price;
  const currentPrice = selectedVariant.effectivePrice ?? selectedVariant.price;
  const hasDiscount = originalPrice > currentPrice;
  const discountPct = hasDiscount ? discountPercent(originalPrice, currentPrice) : 0;
  const isOutOfStock = selectedVariant.stock <= 0;
  const maxQty = Math.min(selectedVariant.stock, 99);

  const onAddToCart = () => {
    if (isOutOfStock) return;
    addToCart.mutate({ variantId: selectedVariant.id, quantity });
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, url: window.location.href });
      } catch {
        // User cancelled share — ignore.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("لینک کپی شد");
      } catch {
        toast.error("کپی لینک ناموفق بود");
      }
    }
  };

  return (
    <div className="sticky top-32 space-y-3 rounded-xl border border-border/60 bg-card p-4">
      {/* Price */}
      <div className="space-y-1">
        {hasDiscount && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="font-bold">
              ٪{toPersianDigits(discountPct)} تخفیف
            </Badge>
            <span className="text-xs text-muted-foreground line-through nums-fa">
              {formatPrice(originalPrice)}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground nums-fa">
            {formatPrice(currentPrice)}
          </span>
          <span className="text-sm text-muted-foreground">تومان</span>
        </div>
      </div>

      <Separator />

      {/* Stock */}
      <div className="flex items-center gap-2 text-sm">
        {isOutOfStock ? (
          <span className="text-destructive">ناموجود</span>
        ) : (
          <>
            <span className="size-2 rounded-full bg-success" />
            <span className="text-success">موجود در انبار</span>
            {selectedVariant.stock <= 5 && (
              <span className="text-warning">
                (تنها {toPersianDigits(selectedVariant.stock)} عدد باقی مانده)
              </span>
            )}
          </>
        )}
      </div>

      {/* Quantity + Add to cart */}
      {!isOutOfStock && (
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-l-none"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="کاهش تعداد"
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-10 text-center text-sm font-medium nums-fa">
              {toPersianDigits(quantity)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-r-none"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="افزایش تعداد"
            >
              <Plus className="size-3" />
            </Button>
          </div>
          <Button
            onClick={onAddToCart}
            disabled={addToCart.isPending}
            className="flex-1"
            size="lg"
          >
            <ShoppingCart className="size-4" />
            {addToCart.isPending ? "در حال افزودن..." : "افزودن به سبد"}
          </Button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <WishlistButton
          productId={product.id}
          variant="outline"
          size="sm"
          showLabel
        />
        <ComparisonButton
          productId={product.id}
          variant="outline"
          size="sm"
          showLabel
        />
        <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
          <Share2 className="size-4" />
          اشتراک
        </Button>
      </div>

      <Separator />

      {/* Trust badges */}
      <ul className="space-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Truck className="size-4 text-primary" />
          ارسال سریع به سراسر کشور
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          ضمانت اصالت کالا
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="size-4 text-primary" />
          ۷ روز ضمانت بازگشت کالا
        </li>
      </ul>
    </div>
  );
}

/* ───────── Description / Specs / Shipping ───────── */

function ProductDescription({ html }: { html?: string | null }) {
  if (!html) {
    return (
      <p className="text-sm text-muted-foreground">
        توضیحاتی برای این محصول ثبت نشده است.
      </p>
    );
  }
  return (
    <div
      className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_img]:rounded-lg [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pr-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ProductSpecs({
  variant,
  categories,
  brand,
}: {
  variant: ProductVariant | null;
  categories: ProductDetailProduct["categories"] | undefined;
  brand: ProductDetailProduct["brand"] | null;
}) {
  const rows: { label: string; value: string }[] = [];
  if (brand) rows.push({ label: "برند", value: brand.name });
  if (categories && categories.length > 0) {
    rows.push({ label: "دسته‌بندی", value: categories.map((c) => c.name).join("، ") });
  }
  if (variant) {
    rows.push({ label: "کد SKU", value: variant.sku });
    const avs = getVariantAttributeValues(variant);
    for (const av of avs) {
      const attrName = av.attribute?.name ?? "ویژگی";
      rows.push({ label: attrName, value: av.value });
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">مشخصاتی ثبت نشده است.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
              <td className="w-1/3 px-3 py-2 font-medium text-foreground">{r.label}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShippingInfo() {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>
        سفارش‌های شما پس از تأیید نهایی، در کوتاه‌ترین زمان ممکن پردازش و ارسال
        می‌شوند. زمان تحویل تقریبی بر اساس شرکت حمل و نقل انتخاب‌شده متفاوت است.
      </p>
      <ul className="space-y-2">
        <li>• ارسال به سراسر کشور با شرکت‌های حمل و نقل معتبر</li>
        <li>• پرداخت در محل برای برخی سفارش‌ها</li>
        <li>• ۷ روز فرصت بازگشت کالا (با رعایت شرایط)</li>
        <li>• ضمانت اصالت و سلامت کالا</li>
      </ul>
    </div>
  );
}

/* ───────── Related products ───────── */

function RelatedProducts({ product }: { product: ProductDetailProduct }) {
  // Use first category to fetch related.
  const firstCategory = getProductCategories(product)[0];
  const { data, isLoading } = useProducts({
    categorySlug: firstCategory?.slug,
    limit: 5,
  });

  const related = (data?.items ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  if (isLoading || related.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">محصولات مرتبط</h2>
        {firstCategory && (
          <Link
            href={`/categories/${firstCategory.slug}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            مشاهده همه
            <ChevronLeft className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ───────── Skeleton ───────── */

function ProductDetailSkeleton() {
  return (
    <div className="container-site py-6">
      <Skeleton className="h-4 w-64" />
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-3 lg:col-span-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
