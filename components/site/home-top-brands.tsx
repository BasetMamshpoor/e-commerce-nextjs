"use client";

import Link from "next/link";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { useBrands } from "@/features/catalog/hooks/use-brands";

export function HomeTopBrands() {
  const { data: brands, isLoading } = useBrands();
  const top = (brands ?? []).slice(0, 10);

  if (!isLoading && top.length === 0) return null;

  return (
    <section className="mb-10" aria-label="برندهای محبوب">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">برندهای محبوب</h2>
        <Link
          href="/brands"
          className="text-sm text-primary hover:underline"
        >
          مشاهده همه
        </Link>
      </div>
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="size-20 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {top.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card p-2 transition-all hover:border-primary/40 hover:shadow-sm sm:size-24"
              title={b.name}
            >
              {b.logoUrl ? (
                <Image
                  src={b.logoUrl}
                  alt={b.name}
                  width={80}
                  height={80}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-center text-xs font-medium text-foreground">
                  {b.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
