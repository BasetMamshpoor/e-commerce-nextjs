"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Scale, X, ShoppingBag, ArrowLeft, Plus, Search, Check, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { productsService } from "@/services";
import type { PaginatedData, Product } from "@/types/domain";
import { formatToman, formatPrice, toPersianDigits } from "@/utils/format";
import { getProductImageUrl } from "@/types/domain";
import { cn } from "@/lib/utils";

const MAX_COMPARE = 4;

export default function ComparisonPage({ params }: { params: Promise<{ ids?: string[] }> }) {
  const { ids: rawIds } = React.use(params);
  const productIds = rawIds ?? [];

  if (productIds.length === 0) {
    return (
      <div className="container-site py-12">
        <EmptyState icon={<Scale className="size-16" />} title="محصولی برای مقایسه انتخاب نشده" description="برای مقایسه محصولات، از صفحه جزئیات محصول دکمه مقایسه را بزنید یا محصولات را از زیر اضافه کنید." className="border border-dashed border-border rounded-xl" />
      </div>
    );
  }
  if (productIds.length > MAX_COMPARE) {
    return (
      <div className="container-site py-12">
        <EmptyState icon={<Scale className="size-16" />} title="حداکثر ۴ محصول قابل مقایسه است" description="لطفاً برخی محصولات را حذف کنید تا تعداد به ۴ برسد." className="border border-dashed border-border rounded-xl" />
      </div>
    );
  }
  return <ComparisonContent productIds={productIds} />;
}

function ComparisonContent({ productIds }: { productIds: string[] }) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["compare-products", productIds],
    queryFn: async () => { const all = await productsService.list({ limit: 100 }); return all.items.filter((p) => productIds.includes(p.id)); },
    staleTime: 30 * 1000,
  });

  const removeProduct = (id: string) => {
    const newIds = productIds.filter((pid) => pid !== id);
    router.push(newIds.length === 0 ? "/products" : `/comparison/${newIds.join("/")}`);
  };

  const addProduct = (id: string) => {
    if (productIds.includes(id)) { toast.error("این محصول قبلاً اضافه شده"); return; }
    if (productIds.length >= MAX_COMPARE) { toast.error("حداکثر ۴ محصول قابل مقایسه است"); return; }
    router.push(`/comparison/${[...productIds, id].join("/")}`);
    setAddModalOpen(false);
  };

  return (
    <div className="container-site py-6">
      <Breadcrumb items={[{ name: "خانه", url: "/" }, { name: "مقایسه", url: `/comparison/${productIds.join("/")}` }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">مقایسه محصولات<span className="mr-2 text-sm font-normal text-muted-foreground">({toPersianDigits(productIds.length)} از {toPersianDigits(MAX_COMPARE)})</span></h1>
        {productIds.length < MAX_COMPARE && <Button onClick={() => setAddModalOpen(true)}><Plus className="size-4" />افزودن محصول</Button>}
      </div>
      {isLoading ? <Skeleton className="h-96 w-full rounded-xl" /> : !products || products.length === 0 ? (
        <EmptyState icon={<Scale className="size-16" />} title="محصولی یافت نشد" description="محصولات انتخاب‌شده دیگر موجود نیستند." />
      ) : (
        <ComparisonView products={products} onRemove={removeProduct} />
      )}
      <AddProductModal open={addModalOpen} onOpenChange={setAddModalOpen} existingIds={productIds} onAdd={addProduct} />
    </div>
  );
}

function ComparisonView({ products, onRemove }: { products: Product[]; onRemove: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className={cn("grid gap-3", products.length === 1 && "grid-cols-1", products.length === 2 && "grid-cols-1 sm:grid-cols-2", products.length === 3 && "grid-cols-1 sm:grid-cols-3", products.length === 4 && "grid-cols-2 lg:grid-cols-4")}>
        {products.map((p) => <ComparisonProductCard key={p.id} product={p} onRemove={() => onRemove(p.id)} />)}
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-border bg-muted/30"><th className="w-32 p-3 text-right text-xs font-medium text-muted-foreground">ویژگی</th>{products.map((p) => <th key={p.id} className="p-3 text-center text-xs font-medium text-muted-foreground">{p.name}</th>)}</tr></thead>
            <tbody>
              <ComparisonRow label="قیمت" products={products} render={(p) => p.isInStock ? <span className="nums-fa">{formatToman(p.minPrice)}</span> : <span className="text-muted-foreground">—</span>} />
              <ComparisonRow label="موجودی" products={products} render={(p) => p.isInStock ? <span className="inline-flex items-center gap-1 text-green-600"><Check className="size-4" />موجود</span> : <span className="inline-flex items-center gap-1 text-red-600"><X className="size-4" />ناموجود</span>} />
              <ComparisonRow label="تخفیف" products={products} render={(p) => p.hasActiveDiscount ? <span className="text-green-600">دارد</span> : <span className="text-muted-foreground">ندارد</span>} />
              <ComparisonRow label="برند" products={products} render={(p) => p.brand?.name ?? "—"} />
              <ComparisonRow label="محصول ویژه" products={products} render={(p) => p.isFeatured ? <span className="text-amber-600">بله</span> : <span className="text-muted-foreground">خیر</span>} />
              <ComparisonRow label="تنوع‌ها" products={products} render={(p) => <span className="nums-fa">{toPersianDigits(p.variants?.length ?? 0)}</span>} />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ComparisonProductCard({ product, onRemove }: { product: Product; onRemove: () => void }) {
  const mainImage = product.images?.find((i) => i.isMain) ?? product.images?.[0];
  const imgUrl = mainImage ? getProductImageUrl(mainImage) : "";
  const singleVariant = product.variants?.length === 1 ? product.variants[0] : null;
  return (
    <Card className="group relative overflow-hidden border-border/40">
      <Button variant="ghost" size="icon" className="absolute left-2 top-2 z-10 size-7 text-muted-foreground hover:text-destructive" onClick={onRemove}><X className="size-4" /></Button>
      <a href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imgUrl ? <img src={imgUrl} alt={product.name} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex size-full items-center justify-center text-muted-foreground/30"><ShoppingBag className="size-8" /></div>}
          {!product.isInStock && <div className="absolute inset-0 flex items-center justify-center bg-background/60"><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">ناموجود</span></div>}
        </div>
      </a>
      <div className="space-y-1 p-3">
        {product.brand && <span className="text-[11px] text-muted-foreground">{product.brand.name}</span>}
        <a href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary">{product.name}</a>
        <p className="text-sm font-bold text-foreground nums-fa">{formatPrice(product.minPrice)}<span className="mr-1 text-xs font-normal text-muted-foreground">تومان</span></p>
        {singleVariant && singleVariant.stock > 0 && <AddToCartButton variantId={singleVariant.id} fullWidth size="sm" label="افزودن به سبد" />}
      </div>
    </Card>
  );
}

function ComparisonRow({ label, products, render }: { label: string; products: Product[]; render: (p: Product) => React.ReactNode }) {
  return <tr className="border-b border-border/40"><td className="bg-muted/30 p-3 text-xs font-medium text-muted-foreground">{label}</td>{products.map((p) => <td key={p.id} className="p-3 text-center text-sm">{render(p)}</td>)}</tr>;
}

function AddProductModal({ open, onOpenChange, existingIds, onAdd }: any) {
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useQuery<PaginatedData<Product>>({
    queryKey: ["compare-search", search], queryFn: () => productsService.list({ search: search || undefined, limit: 20 }),
    enabled: open, staleTime: 10 * 1000,
  });
  const products = data?.items ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4 pb-3"><DialogTitle>افزودن محصول به مقایسه</DialogTitle></DialogHeader>
        <div className="border-b border-border p-3">
          <div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" placeholder="جست‌وجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" autoFocus /></div>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          : products.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">محصولی یافت نشد</p>
          : <div className="space-y-1">{products.map((p) => {
            const alreadyAdded = existingIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => !alreadyAdded && onAdd(p.id)} disabled={alreadyAdded} className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-right transition-colors", alreadyAdded ? "cursor-not-allowed opacity-50" : "hover:bg-accent")}>
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">{p.images?.[0] && getProductImageUrl(p.images[0]) ? <img src={getProductImageUrl(p.images[0])} alt={p.name} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center"><Package className="size-5 text-muted-foreground" /></div>}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{p.name}</p><p className="text-xs text-muted-foreground nums-fa">{formatPrice(p.minPrice)} تومان</p></div>
                {alreadyAdded ? <Check className="size-5 text-green-600" /> : <Plus className="size-5 text-muted-foreground" />}
              </button>
            );
          })}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
