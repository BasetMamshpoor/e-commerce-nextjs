import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EmptyState } from "@/components/common/empty-state";
import { brandsService } from "@/services";
import type { Brand } from "@/types/domain";
import { absUrl, collectionPageJsonLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "برندها",
  description: "همه برندهای موجود در فروشگاه",
  alternates: { canonical: absUrl("/brands") },
};

export const revalidate = 300;

export default async function BrandsPage() {
  let brands: Brand[] = [];
  try {
    brands = await brandsService.list();
  } catch {
    // Backend unreachable
  }

  return (
    <div className="container-site py-6">
      <Breadcrumb
        items={[
          { name: "خانه", url: "/" },
          { name: "برندها", url: "/brands" },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">همه برندها</h1>

      {brands.length === 0 ? (
        <EmptyState
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
                  <Image src={b.logoUrl} alt={b.name} fill sizes="64px" className="object-contain" />
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

      <JsonLd
        data={collectionPageJsonLd({
          type: "brand",
          name: "برندها",
          url: "/brands",
        })}
      />
    </div>
  );
}
