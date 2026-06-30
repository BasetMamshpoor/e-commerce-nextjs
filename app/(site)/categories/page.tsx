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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((cat) => (
            <CategoryBlock
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              imageUrl={cat.imageUrl}
              subCategories={(cat.children ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
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

function CategoryBlock({
  name,
  slug,
  imageUrl,
  subCategories,
}: {
  name: string;
  slug: string;
  imageUrl?: string | null;
  subCategories: Array<{ id: string; name: string; slug: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Link
        href={`/categories/${slug}`}
        className="flex items-center gap-3 border-b border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/60"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-background">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-lg font-bold text-primary">
              {name.slice(0, 2)}
            </div>
          )}
        </div>
        <h2 className="text-base font-bold text-foreground">{name}</h2>
      </Link>
      {subCategories.length > 0 && (
        <ul className="space-y-1 p-3 text-sm">
          {subCategories.slice(0, 6).map((sub) => (
            <li key={sub.id}>
              <Link
                href={`/categories/${sub.slug}`}
                className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {sub.name}
              </Link>
            </li>
          ))}
          {subCategories.length > 6 && (
            <li>
              <Link
                href={`/categories/${slug}`}
                className="block rounded-md px-2 py-1.5 text-xs text-primary hover:underline"
              >
                + {subCategories.length - 6} زیردسته دیگر
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
