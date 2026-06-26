"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesTree } from "@/features/catalog/hooks/use-categories-tree";
import type { Category } from "@/types/domain";

export function HomeCategoriesGrid() {
  const { data: tree, isLoading } = useCategoriesTree();

  // Flatten top-level categories only (home page shows top-level; nested in /categories page).
  const topCategories = (tree ?? []).slice(0, 12);

  return (
    <section className="mb-10" aria-label="دسته‌بندی‌های محبوب">
      <SectionHeader title="دسته‌بندی‌های محبوب" href="/categories" />
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : topCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">دسته‌بندی‌ای یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {topCategories.map((cat) => (
            <CategoryTile key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-center transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="relative size-16 overflow-hidden rounded-full bg-muted sm:size-20">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
            {category.name.slice(0, 2)}
          </div>
        )}
      </div>
      <span className="line-clamp-1 text-xs font-medium text-foreground sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

export function SectionHeader({
  title,
  href,
  ctaLabel = "مشاهده همه",
}: {
  title: React.ReactNode;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
      {href && (
        <Button asChild variant="ghost" size="sm" className="text-primary">
          <Link href={href}>
            {ctaLabel}
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
