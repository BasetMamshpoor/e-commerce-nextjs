"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Package, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productsService } from "@/services";
import type { Product, ProductStatus } from "@/types/domain";
import { formatPrice, toPersianDigits, formatDateTimeFa } from "@/utils/format";

const STATUS_CONFIG: Record<ProductStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PUBLISHED: { label: "منتشر شده", variant: "default" },
  DRAFT: { label: "پیش‌نویس", variant: "secondary" },
  ARCHIVED: { label: "آرشیو شده", variant: "destructive" },
};

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    productsService.adminById(Number(id)).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto mb-4 size-16 text-muted-foreground/40" />
        <p className="text-muted-foreground">محصول پیدا نشد</p>
        <Button asChild className="mt-4">
          <Link href="/admin/products">بازگشت</Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[product.status];

  const handleDelete = async () => {
    if (!confirm("حذف این محصول؟")) return;
    try {
      await productsService.delete(product.id);
      toast.success("محصول حذف شد");
      window.location.href = "/admin/products";
    } catch {
      toast.error("حذف ناموفق — در سفارش استفاده شده");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/products">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground" dir="ltr">/{product.slug}</p>
          </div>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${product.slug}`} target="_blank">
              <ExternalLink className="size-4" />
              مشاهده در سایت
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
              <Link href={`/admin/products/${product.id}/edit`} target="_blank">
                 <Pencil className="size-4" />
                 ویرایش
              </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">اطلاعات محصول</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">برند</p>
                <p className="font-medium">{product.brand?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">محصول ویژه</p>
                <p className="font-medium">{product.isFeatured ? "بله" : "خیر"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">قیمت از</p>
                <p className="font-medium nums-fa">{formatPrice(product.minPrice)} تومان</p>
              </div>
              <div>
                <p className="text-muted-foreground">قیمت تا</p>
                <p className="font-medium nums-fa">{formatPrice(product.maxPrice)} تومان</p>
              </div>
              <div>
                <p className="text-muted-foreground">موجودی</p>
                <Badge variant={product.isInStock ? "default" : "destructive"}>
                  {product.isInStock ? "موجود" : "ناموجود"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">تخفیف فعال</p>
                <Badge variant={product.hasActiveDiscount ? "default" : "secondary"}>
                  {product.hasActiveDiscount ? "دارد" : "ندارد"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">بازدیدها</p>
                <p className="font-medium nums-fa">{toPersianDigits(product.viewCount ?? 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">تاریخ ایجاد</p>
                <p className="font-medium text-xs">{formatDateTimeFa(product.createdAt)}</p>
              </div>
            </div>

            {product.shortDescription && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">توضیح کوتاه</p>
                  <p className="text-sm text-foreground">{product.shortDescription}</p>
                </div>
              </>
            )}

            {product.description && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">توضیحات کامل</p>
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تصاویر ({product.images?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {product.images?.map((img) => {
                  const url = img.media?.url ?? img.url ?? "";
                  return url ? (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={url} alt="" className="size-full object-cover" />
                      {img.isMain && (
                        <span className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[8px] text-primary-foreground">
                          اصلی
                        </span>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تنوع‌ها ({product.variants?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">قیمت</TableHead>
                    <TableHead className="text-xs">موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants?.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs" dir="ltr">{v.sku}</TableCell>
                      <TableCell className="text-xs nums-fa">{formatPrice(v.effectivePrice ?? 0)}</TableCell>
                      <TableCell className="text-xs nums-fa">{toPersianDigits(v.stock)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
