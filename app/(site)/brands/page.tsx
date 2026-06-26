"use client";

import Link from "next/link";
import Image from "next/image";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import { useBrands } from "@/features/catalog/hooks";

export default function BrandsPage() {
  const { data: brands, isLoading } = useBrands();

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "برندها", url: "/brands" },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">همه برندها</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : !brands || brands.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-16" />}
          title="برندی موجود نیست"
          description="در حال حاضر برندی برای نمایش وجود ندارد."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="relative size-16 overflow-hidden">
                {b.logoUrl ? (
                  <Image
                    src={b.logoUrl}
                    alt={b.name}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-2xl font-bold text-primary">
                    {b.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-foreground">{b.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
