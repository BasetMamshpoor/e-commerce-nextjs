"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Pencil,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import {
  ProductImageUploader,
  type ProductImageItem,
} from "@/components/common/product-image-uploader";
import {
  DisplayAttributesEditor,
  type DisplayAttributeFormData,
} from "@/components/common/display-attributes-editor";
import { VariantManagerModal } from "@/components/common/variant-manager-modal";
import {
  productsService,
  brandsService,
  categoriesService,
  attributesService,
} from "@/services";
import type {
  Brand,
  Category,
  Attribute,
  Product,
  ProductStatus,
  DiscountType,
  ProductVariant,
} from "@/types/domain";
import { getProductCategories } from "@/types/domain";
import { formatPrice, toPersianDigits } from "@/utils/format";

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

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    brandId: "",
    shortDescription: "",
    description: "",
    basePrice: "" as string | number,
    status: "DRAFT" as ProductStatus,
    isFeatured: false,
    categoryIds: [] as number[],
    discountType: "NONE" as DiscountType | "NONE",
    discountValue: "" as string | number,
  });

  const [images, setImages] = React.useState<ProductImageItem[]>([]);
  const [deletedImageIds, setDeletedImageIds] = React.useState<number[]>([]);
  const [displayAttrs, setDisplayAttrs] = React.useState<DisplayAttributeFormData[]>([]);

  // Variants — loaded from product, managed via modal.
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  const [variantModalOpen, setVariantModalOpen] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      productsService.adminById(Number(id)),
      brandsService.list({ includeInactive: true }),
      categoriesService.tree(),
      attributesService.list(),
    ])
      .then(([p, b, c, a]) => {
        setBrands(b);
        setCategoryTree(c);
        setAttributes(a);
        const product = p as Product;
        const cats = getProductCategories(product);
        setForm({
          name: product.name,
          brandId: product.brandId != null ? String(product.brandId) : "",
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          basePrice: product.basePrice ?? 0,
          status: product.status,
          isFeatured: product.isFeatured,
          categoryIds: cats.map((cat) => cat.id),
          discountType: product.discountType ?? "NONE",
          discountValue: product.discountValue ?? "",
        });
        setImages(
          (product.images ?? []).map((img) => ({
            id: img.id,
            url: img.url ?? img.media?.url ?? "",
            isMain: img.isMain,
            order: img.order,
          })),
        );
        setVariants(product.variants ?? []);
        setDisplayAttrs(
          (product.displayAttributeValues ?? []).map((d) => ({
            attributeId: d.attributeId,
            value: d.value,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    const basePrice = Number(form.basePrice);
    if (!basePrice || basePrice < 0) {
      toast.error("قیمت پایه الزامی است");
      return;
    }

    setSaving(true);
    try {
      const newImageFiles = images.filter((img): img is ProductImageItem & { file: File } =>
        !img.id && !!img.file,
      );

      const discountType =
        form.discountType === "NONE" ? null : (form.discountType as DiscountType);
      const discountValue =
        discountType && form.discountValue !== "" ? Number(form.discountValue) : null;

      const displayAttributes = displayAttrs
        .filter((d) => d.attributeId !== "" && d.value.trim())
        .map((d) => ({ attributeId: Number(d.attributeId), value: d.value.trim() }));

      const updateBody = {
        name: form.name.trim(),
        brandId: form.brandId ? Number(form.brandId) : null,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        basePrice,
        discountType,
        discountValue,
        status: form.status,
        isFeatured: form.isFeatured,
        categoryIds: form.categoryIds,
        deletedImages: deletedImageIds.length > 0 ? deletedImageIds : undefined,
        displayAttributes,
      };

      if (newImageFiles.length > 0) {
        const fileArray = newImageFiles.map((img) => img.file);
        await productsService.updateWithImages(Number(id), updateBody, fileArray);
      } else {
        await productsService.update(Number(id), updateBody);
      }

      toast.success("محصول به‌روزرسانی شد");
      router.push(`/admin/products/${id}`);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "به‌روزرسانی ناموفق بود");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <button onClick={() => router.back()}>
            <ArrowRight className="size-5" />
          </button>
        </Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">ویرایش محصول</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle className="text-base">اطلاعات اصلی</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نام محصول *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>برند</Label>
                  <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                    <SelectTrigger><SelectValue placeholder="بدون برند" /></SelectTrigger>
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
                <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>توضیحات کامل</Label>
                <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="size-4 rounded" />
                <span className="text-sm">محصول ویژه</span>
              </label>
              <div className="space-y-2">
                <Label>دسته‌بندی‌ها</Label>
                <CategoryTreeSelect categories={categoryTree} selectedIds={form.categoryIds} onChange={(ids) => setForm({ ...form, categoryIds: ids })} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle className="text-base">قیمت و تخفیف</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>قیمت پایه (تومان) *</Label>
                  <Input type="number" dir="ltr" className="text-left" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>نوع تخفیف</Label>
                  <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as DiscountType | "NONE" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.discountType !== "NONE" && (
                <div className="space-y-2">
                  <Label>مقدار تخفیف {form.discountType === "PERCENT" ? "(٪)" : "(تومان)"}</Label>
                  <Input type="number" dir="ltr" className="text-left" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
                </div>
              )}
              {basePriceNum > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">قیمت پایه:</span>
                    <span className="font-bold nums-fa">{formatPrice(basePriceNum)} تومان</span>
                  </div>
                  {variants.length > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">محدوده قیمت تنوع‌ها:</span>
                      <span className="font-bold nums-fa">
                        {formatPrice(basePriceNum + Math.min(...variants.map((v) => v.priceAdjustment)))} — {formatPrice(basePriceNum + Math.max(...variants.map((v) => v.priceAdjustment)))} تومان
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader><CardTitle className="text-base">تصاویر محصول</CardTitle></CardHeader>
            <CardContent>
              <ProductImageUploader images={images} onChange={setImages} deletedImageIds={deletedImageIds} onDeletedIdsChange={setDeletedImageIds} />
              {deletedImageIds.length > 0 && (
                <p className="mt-2 text-xs text-amber-600">{toPersianDigits(deletedImageIds.length)} تصویر برای حذف در ذخیره نهایی</p>
              )}
            </CardContent>
          </Card>

          {/* Variants — read-only list + modal for full management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">تنوع‌ها (Variants)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setVariantModalOpen(true)}>
                  <Pencil className="size-4" />
                  مدیریت تنوع‌ها
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  هیچ تنوعی تعریف نشده. روی «مدیریت تنوع‌ها» کلیک کنید.
                </p>
              ) : (
                variants.map((v, i) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${v.isDefault ? "border-primary/40 bg-primary/5" : "border-border"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary nums-fa">
                          {toPersianDigits(i + 1)}
                        </span>
                        {v.isDefault && <Badge className="text-[10px]">پیش‌فرض</Badge>}
                        {!v.isActive && <Badge variant="secondary" className="text-[10px]">غیرفعال</Badge>}
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{v.sku}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span className="nums-fa">موجودی: {toPersianDigits(v.stock)}</span>
                        <span className="nums-fa">قیمت: {formatPrice(basePriceNum + v.priceAdjustment)} ت</span>
                        {v.weight != null && <span className="nums-fa text-muted-foreground">وزن: {toPersianDigits(v.weight)} kg</span>}
                        {v.attributeValues && v.attributeValues.length > 0 && (
                          <span className="text-muted-foreground">
                            {v.attributeValues.map((av) => av.value).join("، ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Display attributes */}
          <Card>
            <CardHeader><CardTitle className="text-base">ویژگی‌های نمایشی</CardTitle></CardHeader>
            <CardContent>
              <DisplayAttributesEditor attributes={displayAttrs} onChange={setDisplayAttrs} availableAttributes={attributes} />
              <p className="mt-2 text-xs text-muted-foreground">ویژگی‌های نمایشی با دکمه «ذخیره تغییرات» در پایین صفحه ذخیره می‌شوند.</p>
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
                <span className="font-bold nums-fa">{toPersianDigits(variants.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تصاویر:</span>
                <span className="font-bold nums-fa">{toPersianDigits(images.length)}</span>
              </div>
              {deletedImageIds.length > 0 && (
                <div className="flex items-center justify-between text-amber-600">
                  <span>برای حذف:</span>
                  <span className="font-bold nums-fa">{toPersianDigits(deletedImageIds.length)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.back()} disabled={saving}>انصراف</Button>
          </div>
        </div>
      </div>

      {/* Variant manager modal */}
      <VariantManagerModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        productId={Number(id)}
        existingVariants={variants}
        attributes={attributes}
        basePrice={basePriceNum}
        onSaved={setVariants}
      />
    </div>
  );
}
