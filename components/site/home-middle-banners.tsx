"use client";

import Link from "next/link";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { useBanners } from "@/features/catalog/hooks/use-banners";

/**
 * Middle-of-page promotional banners (position="HOME_MIDDLE").
 * Renders up to 3 banners in a responsive grid.
 */
export function HomeMiddleBanners() {
  const { data: banners, isLoading } = useBanners("HOME_MIDDLE");
  const items = (banners ?? []).slice(0, 3);

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-10" aria-label="بنرهای ویژه">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/1] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${items.length > 1 ? "sm:grid-cols-2" : ""} ${items.length > 2 ? "lg:grid-cols-3" : ""}`}>
          {items.map((b) => (
            <Link
              key={b.id}
              href={b.link ?? "#"}
              className="group relative block aspect-[3/1] overflow-hidden rounded-xl bg-muted shadow-sm"
            >
              <Image
                src={b.imageUrl}
                alt={b.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center px-4 sm:px-6">
                <h3 className="text-sm font-bold text-white drop-shadow-md sm:text-lg">
                  {b.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
