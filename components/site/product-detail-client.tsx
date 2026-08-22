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
  Heart,
  Scale,
  X,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Check,
  Sparkles,
  FileText,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { ProductCard } from "@/components/site/product-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useProducts } from "@/features/catalog/hooks/use-products";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { useCart } from "@/features/cart/hooks";
import { useWishlistToggle } from "@/features/wishlist/hooks";
import { useComparisonToggle } from "@/features/comparison/hooks";
import {
  discountPercent,
  formatPrice,
  toPersianDigits,
} from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/domain";
import {
  getProductCategories,
  getProductImageAlt,
  getProductImageUrl,
} from "@/types/domain";

type ProductDetailProduct = Product;

export function ProductDetailClient({ product: initialProduct }: { product: ProductDetailProduct }) {
  const [product] = React.useState(initialProduct);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  React.useEffect(() => {
    const v = product.variants ?? [];
    const def = v.find((x) => x.isDefault) ?? v[0] ?? null;
    setSelectedVariant(def);
  }, [product.id]);

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
  breadcrumbItems.push({ name: product.name, url: `/products/${product.slug}` });

  return (
    <div className="container-site py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProductGallery
          images={product.images ?? []}
          name={product.name}
          onLightboxOpen={(idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
        />
        <div className="space-y-4">
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
          />
        </div>
      </div>

      {/* Tabs — icon-led "line" tabs instead of the plain default pill
          style, and everything explicitly RTL-safe (logical ps-/pe-
          spacing, explicit dir="rtl" on the rich-text description since
          admin-authored HTML doesn't always carry its own direction). */}
      <div className="mt-10">
        <Tabs defaultValue="description" dir="rtl">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1 border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="description"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <FileText className="size-4" />
              توضیحات
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <ListChecks className="size-4" />
              مشخصات
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <Truck className="size-4" />
              ارسال و مرجوعی
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-5">
            <ProductDescription html={product.description} />
          </TabsContent>
          <TabsContent value="specs" className="pt-5">
            <ProductSpecs
              variant={selectedVariant}
              categories={categories}
              brand={product.brand ?? null}
              displayAttributes={product.displayAttributeValues}
            />
          </TabsContent>
          <TabsContent value="shipping" className="pt-5">
            <ShippingInfo />
          </TabsContent>
        </Tabs>
      </div>

      {/* Comments */}
      <CommentSectionLazy productId={product.id} productName={product.name} />

      {/* Related products — prefer backend-provided list, fall back to category-based fetch */}
      <RelatedProducts product={product} />

      {/* Also bought products (from backend — "users who bought this also bought") */}
      <AlsoBoughtProducts product={product} />

      {/* Related blog posts */}
      <RelatedBlogPosts product={product} />

      {/* Lightbox */}
      <Lightbox
        images={product.images ?? []}
        name={product.name}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

/* ───────── Gallery with thumbs ───────── */

function ProductGallery({
  images,
  name,
  onLightboxOpen,
}: {
  images: NonNullable<ProductDetailProduct["images"]>;
  name: string;
  onLightboxOpen: (idx: number) => void;
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const validImages = images.filter((img) => getProductImageUrl(img));

  if (validImages.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-muted">
        <ShoppingCart className="size-16 text-muted-foreground/30" />
      </div>
    );
  }

  const activeImage = validImages[activeIdx];

  return (
    <div className="space-y-3">
      <button
        onClick={() => onLightboxOpen(activeIdx)}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card"
      >
        <Image
          src={getProductImageUrl(activeImage)}
          alt={getProductImageAlt(activeImage, name)}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </button>
      {validImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {validImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 bg-card transition-all",
                i === activeIdx ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={getProductImageUrl(img)}
                alt={getProductImageAlt(img, name)}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Lightbox with zoom ───────── */

function Lightbox({
  images, name, open, onOpenChange, initialIndex,
}: {
  images: NonNullable<ProductDetailProduct["images"]>;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex: number;
}) {
  const [idx, setIdx] = React.useState(initialIndex);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const validImages = images.filter((img) => getProductImageUrl(img));

  React.useEffect(() => {
    if (open) { setIdx(initialIndex); setZoom(1); setPan({ x: 0, y: 0 }); }
  }, [open, initialIndex]);

  if (validImages.length === 0) return null;

  const prev = () => { setIdx((i) => (i === 0 ? validImages.length - 1 : i - 1)); setZoom(1); setPan({ x: 0, y: 0 }); };
  const next = () => { setIdx((i) => (i === validImages.length - 1 ? 0 : i + 1)); setZoom(1); setPan({ x: 0, y: 0 }); };
  const toggleZoom = () => { setZoom((z) => (z === 1 ? 2 : 1)); setPan({ x: 0, y: 0 }); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-0 bg-black/95 p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="relative flex h-[85vh] items-center justify-center overflow-hidden">
          <button onClick={() => onOpenChange(false)} className="absolute left-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
            <X className="size-5" />
          </button>
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <Minus className="size-5" />
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur nums-fa">{toPersianDigits(zoom)}x</span>
            <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <Plus className="size-5" />
            </button>
          </div>
          {validImages.length > 1 && (
            <button onClick={prev} className="absolute right-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <ChevronRight className="size-6" />
            </button>
          )}
          <div
            className="relative h-full w-full cursor-grab active:cursor-grabbing"
            onClick={toggleZoom}
            onMouseDown={(e) => {
              if (zoom === 1) return;
              const startX = e.clientX - pan.x;
              const startY = e.clientY - pan.y;
              const onMove = (ev: MouseEvent) => { setPan({ x: ev.clientX - startX, y: ev.clientY - startY }); };
              const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
            }}
          >
            <Image
              src={getProductImageUrl(validImages[idx])}
              alt={getProductImageAlt(validImages[idx], name)}
              fill
              sizes="100vw"
              className="object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              draggable={false}
            />
          </div>
          {validImages.length > 1 && (
            <button onClick={next} className="absolute left-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <ChevronLeftIcon className="size-6" />
            </button>
          )}
        </div>
        {validImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {validImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => { setIdx(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                className={cn("relative size-14 overflow-hidden rounded-lg border-2 transition-all", i === idx ? "border-primary" : "border-transparent opacity-60")}
              >
                <Image src={getProductImageUrl(img)} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Info + Buy ───────── */

function ProductInfo({
  product, selectedVariant, onSelectVariant,
}: {
  product: ProductDetailProduct;
  selectedVariant: ProductVariant | null;
  onSelectVariant: (v: ProductVariant) => void;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const { data: cart } = useCart();
  const wishlistToggle = useWishlistToggle();
  const comparisonToggle = useComparisonToggle();

  React.useEffect(() => { setQuantity(1); }, [selectedVariant?.id]);

  const cartItem = cart?.items.find((item) => item.variantId === selectedVariant?.id);
  const inCartQty = cartItem?.quantity ?? 0;
  const inWishlist = wishlistToggle.isInWishlist(product.id);
  const inComparison = comparisonToggle.isInComparison(product.id);

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try { await navigator.clipboard.writeText(window.location.href); toast.success("لینک کپی شد"); } catch {}
    }
  };

  // Price calculation depends on pricing mode:
  // - FIXED_IRT: basePrice + variant priceAdjustment
  // - CURRENCY_BASED: currentPriceIRT (auto-updated by backend) + variant priceAdjustment
  const isCurrencyBased = product.pricingMode === "CURRENCY_BASED";
  const baseAmount = isCurrencyBased
    ? (product.currentPriceIRT ?? 0)
    : (product.basePrice ?? 0);
  // originalPrice/finalPrice now come straight from the backend
  // (attachVariantPrices in product.service.ts, via the same
  // pricingEngine used by cart/checkout) — includes attribute-value
  // modifiers AND the product's discount correctly, unlike the previous
  // "baseAmount + priceAdjustment" approximation here, which ignored
  // percentage/fixed attribute modifiers entirely and (before the
  // backend fix) never reflected the discount either, so the "hasDiscount"
  // check below was comparing two equal, always-pre-discount numbers and
  // could never be true.
  const originalPrice = selectedVariant?.originalPrice ?? (baseAmount + (selectedVariant?.priceAdjustment ?? 0));
  const currentPrice = selectedVariant?.finalPrice ?? originalPrice;
  const hasDiscount = originalPrice > currentPrice;
  const discountPct = hasDiscount ? discountPercent(originalPrice, currentPrice) : 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
  const maxQty = Math.min(selectedVariant?.stock ?? 0, 99);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {product.brand && (
          <Link href={`/brands/${product.brand.slug}`} className="text-sm font-medium text-primary hover:underline">
            {product.brand.name}
          </Link>
        )}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => wishlistToggle.toggle(product.id)}>
                  <Heart className={cn("size-4", inWishlist && "fill-primary text-primary")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">علاقه‌مندی</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                  comparisonToggle.toggle(product.id);
                  if (!inComparison) {
                    // Navigate to comparison page with this product
                    window.location.href = `/comparison/${product.id}`;
                  }
                }}>
                  <Scale className={cn("size-4", inComparison && "fill-primary text-primary")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">مقایسه</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={share}>
                  <Share2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">اشتراک‌گذاری</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div>
        <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">{product.name}</h1>
        {product.shortDescription && <p className="mt-2 text-sm text-muted-foreground">{product.shortDescription}</p>}
        {product.avgRating != null && product.reviewCount! > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("size-4", i < Math.round(product.avgRating!) ? "fill-warning text-warning" : "fill-muted text-muted")} />
              ))}
            </div>
            <span className="font-medium nums-fa">{product.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground nums-fa">({toPersianDigits(product.reviewCount!)})</span>
          </div>
        )}
      </div>

      {product.variants && product.variants.length > 0 && (() => {
        // Group variant attribute values by attribute type for separate selection.
        // Each attribute (e.g., "رنگ", "سایز") gets its own selector row.
        // The backend returns nested attribute data inside each variant's attributeValues.

        // Build a map of attributeValueId → { attrId, attrName, attrInputType, value, colorHex } from variant data.
        // Backend returns `id` (AttributeValue.id), not `attributeValueId`.
        const avMap = new Map<number, { attrId: number; attrName: string; attrInputType: string; value: string; colorHex?: string | null }>();
        for (const v of product.variants) {
          for (const av of v.attributeValues ?? []) {
            const avId = av.id ?? av.attributeValueId;
            if (avId && av.attribute && !avMap.has(avId)) {
              avMap.set(avId, {
                attrId: av.attribute.id,
                attrName: av.attribute.name,
                attrInputType: av.attribute.inputType,
                value: av.value ?? "",
                colorHex: av.colorHex,
              });
            }
          }
        }

        // Group attribute value IDs by attribute ID.
        const attrGroups = new Map<number, { attrName: string; attrInputType: string; valueIds: number[] }>();
        for (const [avId, info] of avMap) {
          if (!attrGroups.has(info.attrId)) {
            attrGroups.set(info.attrId, { attrName: info.attrName, attrInputType: info.attrInputType, valueIds: [] });
          }
          attrGroups.get(info.attrId)!.valueIds.push(avId);
        }

        if (attrGroups.size === 0) return null;

        // Get the currently selected attribute value IDs from the selected variant.
        const selectedAvIds = (selectedVariant?.attributeValues ?? []).map(av => av.id ?? av.attributeValueId).filter(Boolean) as number[];

        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">انتخاب گزینه‌ها:</h3>
            {Array.from(attrGroups.entries()).map(([attrId, group]) => {
              const selectedValueId = selectedAvIds.find(id => avMap.get(id)?.attrId === attrId);

              return (
                <div key={attrId} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{group.attrName}:</span>
                    {selectedValueId && (
                      <span className="text-xs font-medium text-foreground">
                        {avMap.get(selectedValueId)?.value}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.valueIds.map((valId) => {
                      const info = avMap.get(valId)!;
                      const isSelected = selectedValueId === valId;
                      // Check if any variant with this value is in stock.
                      const hasStock = product.variants!.some(v => {
                        const vIds = (v.attributeValues ?? []).map(av => av.id ?? av.attributeValueId).filter(Boolean) as number[];
                        return vIds.includes(valId) && v.stock > 0;
                      });
                      return (
                        <button
                          key={valId}
                          onClick={() => {
                            // Find the variant that matches this attribute value
                            // (plus any already-selected values for other attributes).
                            const targetAvIds = selectedAvIds.filter(id => avMap.get(id)?.attrId !== attrId);
                            targetAvIds.push(valId);
                            const matching = product.variants!.find(v => {
                              const vIds = (v.attributeValues ?? []).map(av => av.id ?? av.attributeValueId).filter(Boolean) as number[];
                              return targetAvIds.every(id => vIds.includes(id)) && vIds.length === targetAvIds.length;
                            });
                            if (matching) onSelectVariant(matching);
                          }}
                          disabled={!hasStock}
                          className={cn(
                            "rounded-lg border-2 px-3 py-1.5 text-sm transition-all",
                            isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40",
                            !hasStock && "opacity-40 line-through cursor-not-allowed",
                          )}
                          title={hasStock ? info.value : `${info.value} — ناموجو`}
                        >
                          {group.attrInputType === "COLOR" && info.colorHex ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="size-4 rounded-full border border-border"
                                style={{ backgroundColor: info.colorHex }}
                              />
                              {info.value}
                            </span>
                          ) : (
                            info.value
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      <Separator />

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="font-bold">٪{toPersianDigits(discountPct)} تخفیف</Badge>
              <span className="text-sm text-muted-foreground line-through nums-fa">{formatPrice(originalPrice)}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground nums-fa">{formatPrice(currentPrice)}</span>
            <span className="text-sm text-muted-foreground">تومان</span>
          </div>
        </div>
        {!isOutOfStock && (
          <div className="flex items-center gap-2">
            {/* Quantity-to-add selector — only relevant before the item is
                in the cart. Once it is, AddToCartButton below becomes the
                same +/- stepper that edits the cart quantity directly, so
                having two separate quantity controls at once would be
                redundant and confusing. */}
            {inCartQty === 0 && (
              <div className="flex items-center rounded-lg border border-border">
                <Button variant="ghost" size="icon" className="size-9 rounded-l-none" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
                  <Minus className="size-3" />
                </Button>
                <span className="w-10 text-center text-sm font-medium nums-fa">{toPersianDigits(quantity)}</span>
                <Button variant="ghost" size="icon" className="size-9 rounded-r-none" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}>
                  <Plus className="size-3" />
                </Button>
              </div>
            )}
            <AddToCartButton
              variantId={selectedVariant!.id}
              quantity={quantity}
              maxQuantity={maxQty}
              size="lg"
              fullWidth={inCartQty > 0}
              className="flex-1 shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        {isOutOfStock ? (
          <span className="text-destructive">ناموجود</span>
        ) : (
          <>
            <span className="size-2 rounded-full bg-success" />
            <span className="text-success">موجود در انبار</span>
            {selectedVariant && selectedVariant.stock <= 5 && (
              <span className="text-warning">(تنها {toPersianDigits(selectedVariant.stock)} عدد)</span>
            )}
          </>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 p-3 text-center">
          <Truck className="size-5 text-primary" /><span className="text-xs text-muted-foreground">ارسال سریع</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 p-3 text-center">
          <ShieldCheck className="size-5 text-primary" /><span className="text-xs text-muted-foreground">ضمانت اصالت</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 p-3 text-center">
          <RotateCcw className="size-5 text-primary" /><span className="text-xs text-muted-foreground">بازگشت کالا</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Description / Specs / Shipping ───────── */

function ProductDescription({ html }: { html?: string | null }) {
  if (!html) return <p className="text-sm text-muted-foreground">توضیحاتی برای این محصول ثبت نشده است.</p>;
  return (
    <div
      dir="rtl"
      className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_img]:rounded-lg [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pe-5 [&_ul]:ps-0 [&_ol]:list-decimal [&_ol]:pe-5 [&_ol]:ps-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ProductSpecs({
  variant, categories, brand, displayAttributes,
}: {
  variant: ProductVariant | null;
  categories: ReturnType<typeof getProductCategories>;
  brand: ProductDetailProduct["brand"];
  displayAttributes?: ProductDetailProduct["displayAttributeValues"];
}) {
  const rows: { label: string; value: string }[] = [];
  if (brand) rows.push({ label: "برند", value: brand.name });
  if (categories.length > 0) rows.push({ label: "دسته‌بندی", value: categories.map((c) => c.name).join("، ") });
  if (variant) {
    rows.push({ label: "کد SKU", value: variant.sku });
  }
  // Display attributes (isDisplay=true) from backend
  if (displayAttributes && displayAttributes.length > 0) {
    for (const da of displayAttributes) {
      if (da.value) {
        const label = da.attribute?.name ?? "ویژگی";
        rows.push({ label, value: da.value });
      }
    }
  }
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">مشخصاتی ثبت نشده است.</p>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm last:border-b-0"
        >
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="font-medium text-foreground">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ShippingInfo() {
  const points = [
    { icon: Truck, text: "ارسال به سراسر کشور با شرکت‌های حمل و نقل معتبر" },
    { icon: RotateCcw, text: "۷ روز فرصت بازگشت کالا (با رعایت شرایط)" },
    { icon: ShieldCheck, text: "ضمانت اصالت و سلامت کالا" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        سفارش‌های شما پس از تأیید نهایی، در کوتاه‌ترین زمان ممکن پردازش و ارسال می‌شوند.
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-foreground">
            <p.icon className="mt-0.5 size-4 shrink-0 text-primary" />
            {p.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────── Related products ───────── */

function RelatedProducts({ product }: { product: ProductDetailProduct }) {
  const firstCategory = getProductCategories(product)[0];
  // Prefer backend-provided relatedProducts; fall back to fetching by category.
  const { data, isLoading } = useProducts(
    { categorySlug: firstCategory?.slug, limit: 5 },
    { enabled: !product.relatedProducts || product.relatedProducts.length < 4 }
  );
  const backendRelated = product.relatedProducts ?? [];
  const fetchedRelated = (data?.items ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  const related = backendRelated.length >= 1 ? backendRelated.filter((p) => p.id !== product.id).slice(0, 4) : fetchedRelated;
  if ((!product.relatedProducts || product.relatedProducts.length === 0) && (isLoading || related.length === 0)) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">محصولات مرتبط</h2>
        {firstCategory && (
          <Link href={`/categories/${firstCategory.slug}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
            مشاهده همه
            <ChevronLeft className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {related.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/* ───────── Also Bought Products (backend-provided) ───────── */
function AlsoBoughtProducts({ product }: { product: ProductDetailProduct }) {
  const items = product.alsoBoughtProducts ?? [];
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">خریداران این محصول، این‌ها را هم خریده‌اند</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/* ───────── Related Blog Posts (backend-provided) ───────── */
function RelatedBlogPosts({ product }: { product: ProductDetailProduct }) {
  const items = product.relatedBlogPosts ?? [];
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">مقالات مرتبط</h2>
        <Link href="/blog" className="flex items-center gap-1 text-sm text-primary hover:underline">
          مشاهده همه
          <ChevronLeft className="size-4" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.slice(0, 3).map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`}>
            <Card className="group h-full overflow-hidden border-border/40 card-hover">
              <div className="relative aspect-[16/9] w-full bg-muted">
                {p.coverImageUrl ? (
                  <img src={p.coverImageUrl} alt={p.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/40">
                    <Sparkles className="size-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.title}</p>
                {p.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ───────── Lazy-loaded CommentSection ───────── */

function CommentSectionLazy({ productId, productName }: { productId: number; productName: string }) {
  const CommentSection = React.useMemo(
    () => React.lazy(() => import("@/features/comments/components/comment-section").then((m) => ({ default: m.CommentSection }))),
    [],
  );
  return (
    <React.Suspense fallback={<Skeleton className="mt-8 h-96 w-full rounded-xl" />}>
      <CommentSection productId={productId} productName={productName} />
    </React.Suspense>
  );
}
