"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import { productsService, brandsService, categoriesService } from "@/services";
import type { Brand, Category, Product, ProductStatus } from "@/types/domain";
import { getProductCategories } from "@/types/domain";

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "DRAFT", label: "پیش‌نویس" }, { value: "PUBLISHED", label: "منتشر شده" }, { value: "ARCHIVED", label: "آرشیو شده" },
];

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", brandId: "", shortDescription: "", description: "", status: "DRAFT" as ProductStatus, isFeatured: false, categoryIds: [] as string[] });

  React.useEffect(() => {
    Promise.all([productsService.adminById(id), brandsService.list({ includeInactive: true }), categoriesService.tree()])
      .then(([p, b, c]) => {
        setBrands(b); setCategoryTree(c);
        const cats = getProductCategories(p as Product);
        setForm({ name: p.name, brandId: p.brandId ?? "", shortDescription: p.shortDescription ?? "", description: p.description ?? "", status: p.status, isFeatured: p.isFeatured, categoryIds: cats.map((cat) => cat.id) });
      }).finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async () => {
    if (!form.name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      await productsService.update(id, { name: form.name, brandId: form.brandId || null, shortDescription: form.shortDescription || undefined, description: form.description || undefined, status: form.status, isFeatured: form.isFeatured, categoryIds: form.categoryIds });
      toast.success("محصول به‌روزرسانی شد");
      router.push(`/admin/products/${id}`);
    } catch { toast.error("به‌روزرسانی ناموفق بود"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><button onClick={() => router.back()}><ArrowRight className="size-5" /></button></Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">ویرایش محصول</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">اطلاعات محصول</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>نام محصول *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>برند</Label><Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}><SelectTrigger><SelectValue placeholder="بدون برند" /></SelectTrigger><SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>وضعیت</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>توضیح کوتاه</Label><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
          <div className="space-y-2"><Label>توضیحات کامل</Label><RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="size-4 rounded" /><span className="text-sm">محصول ویژه</span></label>
          <div className="space-y-2"><Label>دسته‌بندی‌ها</Label><CategoryTreeSelect categories={categoryTree} selectedIds={form.categoryIds} onChange={(ids) => setForm({ ...form, categoryIds: ids })} /></div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>انصراف</Button>
        <Button className="flex-1" onClick={onSubmit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}ذخیره تغییرات</Button>
      </div>
    </div>
  );
}
