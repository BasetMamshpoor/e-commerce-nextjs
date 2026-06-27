"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/features/admin/components/admin-table";
import { productsService } from "@/services";
import type { PaginatedData, Product, ProductStatus } from "@/types/domain";
import { formatPrice, toPersianDigits, formatDateTimeFa } from "@/utils/format";

const STATUS_CONFIG: Record<ProductStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PUBLISHED: { label: "منتشر شده", variant: "default" },
  DRAFT: { label: "پیش‌نویس", variant: "secondary" },
  ARCHIVED: { label: "آرشیو شده", variant: "destructive" },
};

export default function AdminProductsPage() {
  const [data, setData] = React.useState<PaginatedData<Product> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    productsService
      .adminList({ page, limit: 20, search: search || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search]);

  const products = data?.items ?? [];

  return (
    <AdminTable
      title="محصولات"
      description="مدیریت محصولات فروشگاه"
      columns={[
        {
          key: "name",
          header: "نام محصول",
          render: (p) => (
            <Link
              href={`/admin/products/${p.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {p.name}
            </Link>
          ),
        },
        {
          key: "brand",
          header: "برند",
          render: (p) => p.brand?.name ?? "—",
        },
        {
          key: "price",
          header: "قیمت",
          align: "left",
          render: (p) => (
            <span className="nums-fa">
              {p.minPrice === p.maxPrice
                ? formatPrice(p.minPrice)
                : `${formatPrice(p.minPrice)} - ${formatPrice(p.maxPrice)}`}
            </span>
          ),
        },
        {
          key: "stock",
          header: "موجودی",
          align: "center",
          render: (p) => (
            <Badge variant={p.isInStock ? "default" : "destructive"}>
              {p.isInStock ? "موجود" : "ناموجود"}
            </Badge>
          ),
        },
        {
          key: "status",
          header: "وضعیت",
          render: (p) => {
            const cfg = STATUS_CONFIG[p.status];
            return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
          },
        },
        {
          key: "createdAt",
          header: "تاریخ",
          render: (p) => (
            <span className="text-xs text-muted-foreground">
              {formatDateTimeFa(p.createdAt)}
            </span>
          ),
        },
      ]}
      data={products}
      isLoading={loading}
      getRowId={(p) => p.id}
      getRowHref={(p) => `/admin/products/${p.id}`}
      page={page}
      totalPages={data?.meta.totalPages ?? 1}
      total={data?.meta.total ?? 0}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="جست‌وجوی محصول..."
      emptyTitle="محصولی یافت نشد"
      emptyDescription="برای افزودن محصول جدید، روی دکمه زیر کلیک کنید."
      emptyAction={
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </Button>
      }
      headerActions={
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </Button>
      }
    />
  );
}
