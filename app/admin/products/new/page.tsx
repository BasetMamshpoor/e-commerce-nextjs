"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import { VariantBuilder, type VariantFormData } from "@/components/common/variant-builder";
import { productsService, brandsService, categoriesService, attributesService } from "@/services";
import type { Brand, Category, Attribute, ProductStatus } from "@/types/domain";

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "DRAFT", label: "پیش‌نویس" }, { value: "PUBLISHED", label: "منتشر شده" }, { value: "ARCHIVED", label: "آرشیو شده" },
];

export default function AdminProductNewPage() {
  const router = useRouter();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", brandId: "", shortDescription: "", description: "", status: "DRAFT" as ProductStatus, isFeatured: false, categoryIds: [] as string[] });
  const [variants, setVariants] = React.useState<VariantFormData[]>([{ sku: "", price: 0, stock: 0, isDefault: true, attributeValueIds: [] }]);

  React.useEffect(() => {
    Promise.all([brandsService.list({ includeInactive: true }), categoriesService.tree(), attributesService.list()])
      .then(([b, c, a]) => { setBrands(b); setCategoryTree(c); setAttributes(a); })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async () => {
    if (!form.name.trim()) { toast.error("نام محصول الزامی است"); return; }
    if (variants[0].price <= 0) { toast.error("قیمت تنوع الزامی است"); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name, brandId: form.brandId || undefined, shortDescription: form.shortDescription || undefined,
        description: form.description || undefined, status: form.status, isFeatured: form.isFeatured,
        categoryIds: form.categoryIds,
        variants: variants.map((v) => ({ sku: v.sku || `SKU-${Date.now()}`, price: Number(v.price), compareAtPrice: v.compareAtPrice || undefined, discountType: v.discountType || undefined, discountValue: v.discountValue || undefined, stock: Number(v.stock), isDefault: v.isDefault, attributeValueIds: v.attributeValueIds })),
        images: [],
      };
      const product = await productsService.create(body);
      toast.success("محصول ایجاد شد");
      router.push(`/admin/products/${product.id}`);
    } catch { toast.error("ایجاد محصول ناموفق بود"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><button onClick={() => router.back()}><ArrowRight className="size-5" /></button></Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">محصول جدید</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">اطلاعات اصلی</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>نام محصول *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: کفش اسنیکر نایک Air Max" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>برند</Label><Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}><SelectTrigger><SelectValue placeholder="انتخاب برند" /></SelectTrigger><SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>وضعیت</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>توضیح کوتاه</Label><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="توضیح یک‌خطی محصول" /></div>
            <div className="space-y-2"><Label>توضیحات کامل</Label><RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="توضیحات کامل محصول را بنویسید..." /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="size-4 rounded" /><span className="text-sm">محصول ویژه</span></label>
            <div className="space-y-2"><Label>دسته‌بندی‌ها</Label><CategoryTreeSelect categories={categoryTree} selectedIds={form.categoryIds} onChange={(ids) => setForm({ ...form, categoryIds: ids })} /></div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">تنوع‌ها (Variants)</CardTitle></CardHeader><CardContent><VariantBuilder variants={variants} onChange={setVariants} attributes={attributes} /></CardContent></Card>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>انصراف</Button>
            <Button className="flex-1" onClick={onSubmit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}ایجاد محصول</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
