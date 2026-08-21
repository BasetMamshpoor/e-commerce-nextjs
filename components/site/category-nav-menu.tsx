"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesTree } from "@/features/catalog/hooks";
import type { Category } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Single "دسته‌بندی‌ها" trigger — hovering opens a cascading multi-column
 * flyout (a column per level, populated on hover of the item above it),
 * supporting an arbitrary category tree depth rather than the fixed
 * 2-level flyout this replaced. Desktop only (rendered under `lg:block`
 * by Header) — mobile reaches categories via the bottom nav bar instead,
 * where hover isn't a meaningful interaction anyway.
 */
export function CategoryNavMenu() {
  const { data: tree, isLoading } = useCategoriesTree();
  const [open, setOpen] = React.useState(false);
  const [activePath, setActivePath] = React.useState<Category[]>([]);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setActivePath([]);
    }, 150);
  };

  React.useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (isLoading) {
    return <Skeleton className="h-5 w-24" />;
  }
  if (!tree || tree.length === 0) return null;

  // One column for the root list, plus one more column per level of
  // activePath whose category actually has children.
  const columns: Category[][] = [tree];
  for (const cat of activePath) {
    if (cat.children && cat.children.length > 0) columns.push(cat.children);
    else break;
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        type="button"
        className="flex items-center gap-1 py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        دسته‌بندی‌ها
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-50 flex overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-fade-in"
          onMouseEnter={openMenu}
        >
          {columns.map((items, colIndex) => (
            <ul
              key={colIndex}
              className="max-h-96 w-56 overflow-y-auto border-e border-border/60 py-2 last:border-e-0"
            >
              {items.map((cat) => {
                const isActive = activePath[colIndex]?.id === cat.id;
                const hasChildren = (cat.children?.length ?? 0) > 0;
                return (
                  <li key={cat.id}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      onMouseEnter={() => setActivePath((prev) => [...prev.slice(0, colIndex), cat])}
                      onClick={() => {
                        setOpen(false);
                        setActivePath([]);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors",
                        isActive ? "bg-accent text-primary" : "text-foreground hover:bg-accent/60",
                      )}
                    >
                      {cat.name}
                      {hasChildren && <ChevronLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}
