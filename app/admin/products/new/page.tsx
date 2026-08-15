"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import { VariantBuilder, sanitizeAttributeValuesForApi, type VariantFormData } from "@/components/common/variant-builder";
import {
  ProductImageUploader,
  type ProductImageItem,
} from "@/components/common/product-image-uploader";
import {
  DisplayAttributesEditor,
  type DisplayAttributeFormData,
} from "@/components/common/display-attributes-editor";
import {
  productsService,
  brandsService,
  categoriesService,
  attributesService,
  currenciesService,
  mediaService,
} from "@/services";
import type { Brand, Category, Attribute, Currency, ProductStatus, DiscountType, ProductPricingMode } from "@/types/domain";
import { formatPrice, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "PUBLISHED", label: "منتشر شده" },
  { value: "ARCHIVED", label: "آرشیو شده" },
];

const DISCOUNT_TYPE_OPTIONS: { value: DiscountType | "NONE"; label: string }[] = [
  { value: "NONE", label: "بدون تخفیف" },
  { value: "PERCENT", label: "درصدی (%)" },
  { value: "FIXED", label: "مبلغ ثابت (تومان)" },
];

export default function AdminProductNewPage() {
  const router = useRouter();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [currencies, setCurrencies] = React.useState<Currency[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    brandId: "",
    shortDescription: "",
    description: "",
    basePrice: "" as string | number,
    pricingMode: "FIXED_IRT" as ProductPricingMode,
    currencyId: "" as string | number,
    sourcePrice: "" as string | number,
    priceBufferPercent: "0" as string | number,
    status: "DRAFT" as ProductStatus,
    isFeatured: false,
    categoryIds: [] as number[],
    discountType: "NONE" as DiscountType | "NONE",
    discountValue: "" as string | number,
  });

  const [variants, setVariants] = React.useState<VariantFormData[]>([]);
  const [images, setImages] = React.useState<ProductImageItem[]>([]);
  const [displayAttrs, setDisplayAttrs] = React.useState<DisplayAttributeFormData[]>([]);

  // Initial load: brands + category tree + ALL attributes
  // Per api.md: attributes are global, filtered by type (isVariant, isDisplay) —
  // NOT filtered by product's categories.
  React.useEffect(() => {
    Promise.all([
      brandsService.list({ includeInactive: true }),
      categoriesService.tree(),
      attributesService.list(),
      currenciesService.adminList(),
    ])
      .then(([b, c, a, cur]) => {
        setBrands(b);
        setCategoryTree(c);
        setAttributes(a);
        setCurrencies(cur);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام محصول الزامی است");
      return;
    }

    const isCurrencyBased = form.pricingMode === "CURRENCY_BASED";
    let basePrice = 0;
    let sourcePrice: number | undefined;
    let currencyId: number | undefined;

    if (isCurrencyBased) {
      currencyId = form.currencyId ? Number(form.currencyId) : undefined;
      sourcePrice = form.sourcePrice ? Number(form.sourcePrice) : undefined;
      if (!currencyId) {
        toast.error("انتخاب ارز برای قیمت‌گذاری ارزی الزامی است");
        return;
      }
      if (!sourcePrice || sourcePrice <= 0) {
        toast.error("قیمت به ارز مبدأ باید بزرگتر از صفر باشد");
        return;
      }
    } else {
      basePrice = Number(form.basePrice);
      if (!basePrice || basePrice < 1000) {
        toast.error("قیمت پایه محصول (حداقل ۱۰۰۰ تومان) الزامی است");
        return;
      }
    }

    const bufferPercent = Number(form.priceBufferPercent) || 0;
    if (bufferPercent < 0 || bufferPercent > 100) {
      toast.error("درصد بافر باید بین ۰ تا ۱۰۰ باشد");
      return;
    }

    if (form.categoryIds.length === 0) {
      toast.error("حداقل یک دسته‌بندی الزامی است");
      return;
    }
    if (variants.length === 0) {
      toast.error("حداقل یک تنوع (Variant) الزامی است");
      return;
    }

    setSaving(true);
    try {
      // 1. Build discount fields
      const discountType =
        form.discountType === "NONE" ? undefined : (form.discountType as DiscountType);
      const discountValue =
        discountType && form.discountValue !== "" ? Number(form.discountValue) : undefined;

      // 2. Build displayAttributes
      const displayAttributes = displayAttrs
        .filter((d) => d.attributeId !== "" && d.value.trim())
        .map((d) => ({ attributeId: Number(d.attributeId), value: d.value.trim() }));

      // 3. Build variants — auto-generate SKU if empty
      const variantsPayload = variants.map((v, i) => ({
        sku: v.sku.trim() || `SKU-${form.name.replace(/\s+/g, "-").toUpperCase().slice(0, 8)}-${i + 1}`,
        priceAdjustment: Number(v.priceAdjustment) || 0,
        stock: Number(v.stock) || 0,
        weight: v.weight,
        isDefault: v.isDefault,
        isActive: v.isActive,
        attributeValues: sanitizeAttributeValuesForApi(v.attributeValues),
      }));

      // 4. Separate images by source:
      //   - Files (uploaded from disk) → uploaded to /media FIRST (see below),
      //     then merged into the JSON "images" array as {mediaId, order, isMain}.
      //   - mediaId (selected from gallery) → JSON field "images: [{mediaId, order, isMain}]"
      //   - Existing images (already saved on this product, loaded from backend) → not sent on CREATE
      //
      // NOTE: we intentionally do NOT use multipart/form-data with bracket-notation
      // fields (e.g. "variants[0][attributeValues][0][attributeValueId]") for this
      // request. Multer parses multipart fields as flat string keys — it does not
      // reconstruct nested objects/arrays the way qs does for urlencoded bodies —
      // so a multipart POST with deeply nested `variants` alongside file uploads
      // silently loses/mismatches the variants data (this was a major - probably
      // THE major - source of "variants don't save" bugs). Uploading files to the
      // already-working POST /media/bulk endpoint first, then sending one plain
      // JSON body, sidesteps that entirely.
      const newImageFiles: { file: File; order: number; isMain: boolean }[] = [];
      const galleryImages: Array<{ mediaId: number; order: number; isMain: boolean }> = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.file) {
          newImageFiles.push({ file: img.file, order: i, isMain: img.isMain });
        } else if (img.mediaId) {
          galleryImages.push({ mediaId: img.mediaId, order: i, isMain: img.isMain });
        }
        // Existing images (img.id but no mediaId/file) are skipped on create.
      }

      // Upload any new files to /media first (proven, flat multipart endpoint),
      // then fold the resulting mediaIds into the same `images` array.
      if (newImageFiles.length > 0) {
        const uploaded = await mediaService.bulkUpload(
          newImageFiles.map((f) => f.file),
          "products",
        );
        uploaded.items.forEach((media, i) => {
          galleryImages.push({
            mediaId: media.id,
            order: newImageFiles[i].order,
            isMain: newImageFiles[i].isMain,
          });
        });
      }
      galleryImages.sort((a, b) => a.order - b.order);

      // 5. Build the body — always sent as plain JSON (see note above).
      const body = {
        name: form.name.trim(),
        brandId: form.brandId ? Number(form.brandId) : undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        basePrice,
        pricingMode: form.pricingMode,
        currencyId: isCurrencyBased ? currencyId : undefined,
        sourcePrice: isCurrencyBased ? sourcePrice : undefined,
        priceBufferPercent: bufferPercent,
        discountType,
        discountValue,
        status: form.status,
        isFeatured: form.isFeatured,
        categoryIds: form.categoryIds,
        images: galleryImages.length > 0 ? galleryImages : undefined,
        variants: variantsPayload,
        displayAttributes,
      };

      // 6. Create product — plain JSON (no multipart).
      const product = await productsService.create(body);
      toast.success("محصول ایجاد شد");
      router.push(`/admin/products/${product.id}`);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ایجاد محصول ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const basePriceNum = Number(form.basePrice) || 0;
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const effectivePrice =
    basePriceNum + (defaultVariant ? Number(defaultVariant.priceAdjustment) || 0 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <button onClick={() => router.back()}>
            <ArrowRight className="size-5" />
          </button>
        </Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">محصول جدید</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نام محصول *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: کفش اسنیکر نایک Air Max"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>برند</Label>
                  <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                    <SelectTrigger><SelectValue placeholder="انتخاب برند" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>وضعیت</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>توضیح کوتاه</Label>
                <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="توضیح یک‌خطی محصول" />
              </div>
              <div className="space-y-2">
                <Label>توضیحات کامل</Label>
                <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="توضیحات کامل محصول را بنویسید..." />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="size-4 rounded" />
                <span className="text-sm">محصول ویژه</span>
              </label>
              <div className="space-y-2">
                <Label>دسته‌بندی‌ها *</Label>
                <CategoryTreeSelect categories={categoryTree} selectedIds={form.categoryIds} onChange={(ids) => setForm({ ...form, categoryIds: ids })} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle className="text-base">قیمت و تخفیف</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing mode selector */}
              <div className="space-y-2">
                <Label>مدل قیمت‌گذاری</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricingMode: "FIXED_IRT" })}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                      form.pricingMode === "FIXED_IRT"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <p className="font-medium">قیمت ثابت (تومان)</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">قیمت به تومان وارد می‌شود</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricingMode: "CURRENCY_BASED" })}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                      form.pricingMode === "CURRENCY_BASED"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <p className="font-medium">قیمت ارزی</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">قیمت به ارز مبدأ + نرخ خودکار</p>
                  </button>
                </div>
              </div>

              {/* Conditional fields based on pricing mode */}
              {form.pricingMode === "FIXED_IRT" ? (
                <div className="space-y-2">
                  <Label>قیمت پایه (تومان) *</Label>
                  <Input type="number" dir="ltr" className="text-left" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="مثال: 250000" />
                  <p className="text-xs text-muted-foreground">حداقل ۱۰۰۰ تومان. قیمت هر تنوع = پایه + افزایش قیمت تنوع.</p>
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>ارز مبدأ *</Label>
                      <Select
                        value={form.currencyId ? String(form.currencyId) : ""}
                        onValueChange={(v) => setForm({ ...form, currencyId: Number(v) })}
                      >
                        <SelectTrigger><SelectValue placeholder="انتخاب ارز" /></SelectTrigger>
                        <SelectContent>
                          {currencies.filter((c) => c.isActive).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.code} {c.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>قیمت به ارز مبدأ *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        dir="ltr"
                        className="text-left"
                        value={form.sourcePrice}
                        onChange={(e) => setForm({ ...form, sourcePrice: e.target.value })}
                        placeholder="مثال: 999.99"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>درصد بافر نوسان (۰–۱۰۰)</Label>
                    <Input
                      type="number"
                      dir="ltr"
                      className="text-left"
                      value={form.priceBufferPercent}
                      onChange={(e) => setForm({ ...form, priceBufferPercent: e.target.value })}
                      placeholder="مثال: 2"
                    />
                    <p className="text-xs text-muted-foreground">
                      حداکثر نوسان مجاز قیمت. قیمت نهایی = currentPriceIRT × (۱ + بافر/۱۰۰)
                    </p>
                  </div>
                  {/* Show current IRT estimate */}
                  {form.currencyId && form.sourcePrice && (() => {
                    const cur = currencies.find((c) => c.id === Number(form.currencyId));
                    if (cur?.currentRate) {
                      const estimate = Number(form.sourcePrice) * cur.currentRate;
                      return (
                        <div className="rounded-md bg-muted/50 p-2 text-xs">
                          <span className="text-muted-foreground">تقریب قیمت تومانی:</span>{" "}
                          <span className="font-bold nums-fa">{formatPrice(estimate)} تومان</span>
                          <span className="text-muted-foreground"> (نرخ فعلی: {toPersianDigits(formatPrice(cur.currentRate))})</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Discount (applies to both modes) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع تخفیف</Label>
                  <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as DiscountType | "NONE" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.discountType !== "NONE" && (
                  <div className="space-y-2">
                    <Label>مقدار تخفیف {form.discountType === "PERCENT" ? "(٪)" : "(تومان)"}</Label>
                    <Input type="number" dir="ltr" className="text-left" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "PERCENT" ? "مثال: 10" : "مثال: 50000"} />
                  </div>
                )}
              </div>
              {form.discountType === "PERCENT" && form.discountValue !== "" && (Number(form.discountValue) < 1 || Number(form.discountValue) > 100) && (
                <p className="text-xs text-destructive">درصد تخفیف باید بین ۱ تا ۱۰۰ باشد</p>
              )}
              {basePriceNum > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">قیمت پایه:</span>
                    <span className="font-bold nums-fa">{formatPrice(basePriceNum)} تومان</span>
                  </div>
                  {defaultVariant && Number(defaultVariant.priceAdjustment) !== 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">افزایش تنوع پیش‌فرض:</span>
                      <span className="font-bold nums-fa">{Number(defaultVariant.priceAdjustment) > 0 ? "+" : ""}{formatPrice(Number(defaultVariant.priceAdjustment))} تومان</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">قیمت تنوع پیش‌فرض:</span>
                    <span className="font-bold text-primary nums-fa">{formatPrice(effectivePrice)} تومان</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader><CardTitle className="text-base">تصاویر محصول</CardTitle></CardHeader>
            <CardContent>
              <ProductImageUploader images={images} onChange={setImages} deletedImageIds={[]} onDeletedIdsChange={() => {}} />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader><CardTitle className="text-base">تنوع‌ها (Variants)</CardTitle></CardHeader>
            <CardContent>
              <VariantBuilder
                variants={variants}
                onChange={setVariants}
                attributes={attributes}
                basePrice={basePriceNum}
                pricingMode={form.pricingMode}
              />
            </CardContent>
          </Card>

          {/* Display attributes */}
          <Card>
            <CardHeader><CardTitle className="text-base">ویژگی‌های نمایشی</CardTitle></CardHeader>
            <CardContent>
              <DisplayAttributesEditor attributes={displayAttrs} onChange={setDisplayAttrs} availableAttributes={attributes} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">خلاصه</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تنوع‌ها:</span>
                <span className="font-bold nums-fa">{variants.length > 0 ? toPersianDigits(variants.length) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تصاویر:</span>
                <span className="font-bold nums-fa">{toPersianDigits(images.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ویژگی‌های نمایشی:</span>
                <span className="font-bold nums-fa">{toPersianDigits(displayAttrs.filter((d) => d.attributeId !== "" && d.value.trim()).length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">دسته‌بندی‌ها:</span>
                <span className="font-bold nums-fa">{toPersianDigits(form.categoryIds.length)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "در حال ذخیره..." : "ایجاد محصول"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.back()} disabled={saving}>انصراف</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
