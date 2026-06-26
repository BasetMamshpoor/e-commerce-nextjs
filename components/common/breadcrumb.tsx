import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo";
import { JsonLd } from "@/lib/seo";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb UI component + embedded BreadcrumbList JSON-LD.
 * Renders nothing if there's only one item (homepage).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length <= 1) return null;

  const visibleItems = items.filter((i) => !i.hideInUi);

  return (
    <>
      <nav aria-label="مسیر صفحه" className={cn("py-3", className)}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {visibleItems.map((item, idx) => {
            const isLast = idx === visibleItems.length - 1;
            return (
              <li key={`${item.url}-${idx}`} className="flex items-center gap-1">
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                )}
                {!isLast && <ChevronLeft className="size-3 text-muted-foreground/60" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
