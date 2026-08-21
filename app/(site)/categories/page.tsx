import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { categoriesService } from "@/services";
import type { Category } from "@/types/domain";
import { absUrl, collectionPageJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها",
  description: "همه دسته‌بندی‌های محصولات فروشگاه",
  alternates: { canonical: absUrl("/categories") },
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function CategoriesPage() {
  let tree: Category[] = [];
  try {
    tree = await categoriesService.tree();
  } catch {
    // Backend unreachable
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "دسته‌بندی‌ها", url: "/categories" },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        همه دسته‌بندی‌ها
      </h1>

      {tree.length === 0 ? (
        <EmptyState
          title="دسته‌بندی‌ای موجود نیست"
          description="در حال حاضر دسته‌بندی‌ای برای نمایش وجود ندارد."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {tree.map((cat) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              imageUrl={cat.imageUrl}
              subCategoryCount={(cat.children ?? []).length}
            />
          ))}
        </div>
      )}

      <JsonLd
        data={collectionPageJsonLd({
          type: "category",
          name: "دسته‌بندی‌ها",
          url: "/categories",
        })}
      />
    </div>
  );
}

function CategoryCard({
  name,
  slug,
  imageUrl,
  subCategoryCount,
}: {
  name: string;
  slug: string;
  imageUrl?: string | null;
  subCategoryCount: number;
}) {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60 transition-shadow group-hover:ring-primary/40 sm:size-24">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="96px" className="object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center text-xl font-bold text-primary">
            {name.slice(0, 2)}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground sm:text-base">{name}</h2>
        {subCategoryCount > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subCategoryCount} زیردسته
          </p>
        )}
      </div>
    </Link>
  );
}
