"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Save,
  X,
  Paperclip,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { MultiSelectCombobox } from "@/components/common/multi-select-combobox";
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

  // Variants — loaded from product, managed inline via separate endpoints.
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  const [showAddVariant, setShowAddVariant] = React.useState(false);

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
        const bodyJson = JSON.stringify(updateBody);
        const fileArray = newImageFiles.map((img) => img.file);
        await productsService.updateWithImages(Number(id), bodyJson, fileArray);
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

  // ── Variant inline operations ──

  const onVariantSaved = (variantId: number, updated: ProductVariant) => {
    setVariants(variants.map((v) => (v.id === variantId ? updated : v)));
  };

  const onVariantDeleted = (variantId: number) => {
    setVariants(variants.filter((v) => v.id !== variantId));
  };

  const onVariantAdded = (newVariant: ProductVariant) => {
    setVariants([...variants, newVariant]);
    setShowAddVariant(false);
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

          {/* Variants — inline editing with direct save */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">تنوع‌ها (Variants)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAddVariant(true)}>
                  <Plus className="size-4" />
                  افزودن تنوع
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">هیچ تنوعی تعریف نشده. حداقل یک تنوع الزامی است.</p>
              ) : (
                variants.map((v) => (
                  <InlineVariantEditor
                    key={v.id}
                    variant={v}
                    productId={Number(id)}
                    attributes={attributes}
                    basePrice={basePriceNum}
                    onSaved={(updated) => onVariantSaved(v.id, updated)}
                    onDeleted={() => onVariantDeleted(v.id)}
                    canDelete={variants.length > 1}
                  />
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

      {/* Add new variant form (inline, below the list) */}
      {showAddVariant && (
        <AddVariantForm
          productId={Number(id)}
          attributes={attributes}
          basePrice={basePriceNum}
          onAdded={onVariantAdded}
          onCancel={() => setShowAddVariant(false)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   InlineVariantEditor — each variant is edited and saved DIRECTLY via
   PUT /products/:id/variants/:variantId. No dialog, no "cancel" rollback.
   ════════════════════════════════════════════════════════════════════════════ */

function InlineVariantEditor({
  variant,
  productId,
  attributes,
  basePrice,
  onSaved,
  onDeleted,
  canDelete,
}: {
  variant: ProductVariant;
  productId: number;
  attributes: Attribute[];
  basePrice: number;
  onSaved: (updated: ProductVariant) => void;
  onDeleted: () => void;
  canDelete: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Editable fields
  const [sku, setSku] = React.useState(variant.sku);
  const [priceAdjustment, setPriceAdjustment] = React.useState(variant.priceAdjustment);
  const [stock, setStock] = React.useState(variant.stock);
  const [weight, setWeight] = React.useState(variant.weight != null ? String(variant.weight) : "");
  const [isDefault, setIsDefault] = React.useState(variant.isDefault);
  const [isActive, setIsActive] = React.useState(variant.isActive);
  const [attributeValueIds, setAttributeValueIds] = React.useState<number[]>(variant.attributeValueIds);

  const variantAttributes = attributes.filter((a) => a.isVariant);
  const effectivePrice = basePrice + (editing ? priceAdjustment : variant.priceAdjustment);

  // Sync when variant changes externally
  React.useEffect(() => {
    if (!editing) {
      setSku(variant.sku);
      setPriceAdjustment(variant.priceAdjustment);
      setStock(variant.stock);
      setWeight(variant.weight != null ? String(variant.weight) : "");
      setIsDefault(variant.isDefault);
      setIsActive(variant.isActive);
      setAttributeValueIds(variant.attributeValueIds);
    }
  }, [variant, editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await productsService.updateVariant(productId, variant.id, {
        sku: sku.trim(),
        priceAdjustment: Number(priceAdjustment) || 0,
        stock: Number(stock) || 0,
        weight: weight ? Number(weight) : undefined,
        isDefault,
        isActive,
        attributeValueIds,
      });
      toast.success("تنوع ذخیره شد");
      setEditing(false);
      onSaved(updated);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productsService.deleteVariant(productId, variant.id);
      toast.success("تنوع حذف شد");
      onDeleted();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف ناموفق بود");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${variant.isDefault ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      {/* View mode */}
      {!editing ? (
        <>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary nums-fa">
                  #
                </span>
                {variant.isDefault && <Badge className="text-[10px]">پیش‌فرض</Badge>}
                {!variant.isActive && <Badge variant="secondary" className="text-[10px]">غیرفعال</Badge>}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{variant.sku}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className="nums-fa">موجودی: {toPersianDigits(variant.stock)}</span>
                <span className="nums-fa">قیمت: {formatPrice(effectivePrice)} ت</span>
                {variant.weight != null && <span className="nums-fa text-muted-foreground">وزن: {toPersianDigits(variant.weight)} kg</span>}
                {variant.attributeValues && variant.attributeValues.length > 0 && (
                  <span className="text-muted-foreground">{variant.attributeValues.map((av) => av.value).join("، ")}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(true)}>ویرایش</Button>
              <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={handleDelete} disabled={!canDelete || deleting}>
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Edit mode — inline */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ویرایش تنوع</span>
            <div className="flex gap-1">
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                ذخیره
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>انصراف</Button>
            </div>
          </div>

          {/* Attribute value selectors */}
          {variantAttributes.length > 0 && (
            <div className="space-y-2">
              {variantAttributes.map((attr) => {
                const selectedForAttr = attributeValueIds.filter((id) => attr.values.some((v) => v.id === id));
                return (
                  <div key={attr.id} className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label className="text-xs text-muted-foreground">{attr.name}:</Label>
                    <MultiSelectCombobox
                      options={attr.values.map((v) => ({ value: String(v.id), label: v.value, colorHex: v.colorHex }))}
                      value={selectedForAttr.map(String)}
                      onChange={(vals: string[]) => {
                        const other = attributeValueIds.filter((id) => !attr.values.some((v) => v.id === id));
                        setAttributeValueIds([...other, ...vals.map(Number)]);
                      }}
                      placeholder={`انتخاب ${attr.name}...`}
                      searchPlaceholder="جست‌وجو..."
                      emptyText="موردی یافت نشد"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Separator />

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} dir="ltr" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">موجودی</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} dir="ltr" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">افزایش قیمت</Label>
              <Input type="number" value={priceAdjustment} onChange={(e) => setPriceAdjustment(Number(e.target.value))} dir="ltr" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">وزن (kg)</Label>
              <Input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} dir="ltr" className="h-8 text-xs" placeholder="—" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
              <span className="text-xs">فعال</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded" />
              <span className="text-xs">پیش‌فرض</span>
            </label>
            {basePrice > 0 && (
              <span className="mr-auto text-xs text-success nums-fa">قیمت نهایی: {formatPrice(basePrice + (Number(priceAdjustment) || 0))} ت</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AddVariantForm — adds a new variant via POST /products/:id/variants
   ════════════════════════════════════════════════════════════════════════════ */

function AddVariantForm({
  productId,
  attributes,
  basePrice,
  onAdded,
  onCancel,
}: {
  productId: number;
  attributes: Attribute[];
  basePrice: number;
  onAdded: (v: ProductVariant) => void;
  onCancel: () => void;
}) {
  const [sku, setSku] = React.useState("");
  const [priceAdjustment, setPriceAdjustment] = React.useState(0);
  const [stock, setStock] = React.useState(0);
  const [weight, setWeight] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [attributeValueIds, setAttributeValueIds] = React.useState<number[]>([]);
  const [saving, setSaving] = React.useState(false);

  const variantAttributes = attributes.filter((a) => a.isVariant);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const v = await productsService.addVariant(productId, {
        sku: sku.trim() || `SKU-${Date.now()}`,
        priceAdjustment: Number(priceAdjustment) || 0,
        stock: Number(stock) || 0,
        weight: weight ? Number(weight) : undefined,
        isDefault,
        isActive,
        attributeValueIds,
      });
      toast.success("تنوع اضافه شد");
      onAdded(v);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "افزودن ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">افزودن تنوع جدید</CardTitle>
          <Button size="sm" variant="ghost" onClick={onCancel}><X className="size-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {variantAttributes.length > 0 && (
          <div className="space-y-2">
            {variantAttributes.map((attr) => {
              const selectedForAttr = attributeValueIds.filter((id) => attr.values.some((v) => v.id === id));
              return (
                <div key={attr.id} className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{attr.name}:</Label>
                  <MultiSelectCombobox
                    options={attr.values.map((v) => ({ value: String(v.id), label: v.value, colorHex: v.colorHex }))}
                    value={selectedForAttr.map(String)}
                    onChange={(vals: string[]) => {
                      const other = attributeValueIds.filter((id) => !attr.values.some((v) => v.id === id));
                      setAttributeValueIds([...other, ...vals.map(Number)]);
                    }}
                    placeholder={`انتخاب ${attr.name}...`}
                    searchPlaceholder="جست‌وجو..."
                    emptyText="موردی یافت نشد"
                  />
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} dir="ltr" className="h-8 text-xs" placeholder="خودکار" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">موجودی</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} dir="ltr" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">افزایش قیمت</Label>
            <Input type="number" value={priceAdjustment} onChange={(e) => setPriceAdjustment(Number(e.target.value))} dir="ltr" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">وزن (kg)</Label>
            <Input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} dir="ltr" className="h-8 text-xs" placeholder="—" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
            <span className="text-xs">فعال</span>
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded" />
            <span className="text-xs">پیش‌فرض</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>انصراف</Button>
          <Button size="sm" onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            افزودن تنوع
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
