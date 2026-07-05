"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Package, Tag, FileText, FolderTree } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuickSearch } from "@/features/search/hooks";
import { cn } from "@/lib/utils";
import type { QuickSearchResult } from "@/types/domain";

const TYPE_ICON: Record<QuickSearchResult["type"], React.ReactNode> = {
  product: <Package className="size-4 text-primary" />,
  category: <FolderTree className="size-4 text-blue-500" />,
  blog_post: <FileText className="size-4 text-purple-500" />,
  brand: <Tag className="size-4 text-green-500" />,
};

const TYPE_LABEL: Record<QuickSearchResult["type"], string> = {
  product: "محصول",
  category: "دسته",
  blog_post: "مقاله",
  brand: "برند",
};

function getHref(item: QuickSearchResult): string {
  switch (item.type) {
    case "product":
      return `/products?search=${encodeURIComponent(item.title)}`;
    case "category":
      return `/categories/${item.slug}`;
    case "blog_post":
      return `/blog/${item.slug}`;
    case "brand":
      return `/brands/${item.slug}`;
  }
}

interface SearchAutocompleteProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

export function SearchAutocomplete({
  className,
  placeholder = "جست‌وجو در محصولات...",
  autoFocus,
  onSubmitted,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useQuickSearch(query, open && query.trim().length >= 2);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index when results change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const flatResults = results ?? [];

  const submit = (q: string) => {
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
    onSubmitted?.();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If a result is highlighted, navigate to its dedicated page; else go to /search
    if (activeIndex > 0 && flatResults[activeIndex - 1]) {
      router.push(getHref(flatResults[activeIndex - 1]));
      setOpen(false);
      onSubmitted?.();
    } else {
      submit(query);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && activeIndex > 0 && flatResults[activeIndex - 1]) {
      e.preventDefault();
      router.push(getHref(flatResults[activeIndex - 1]));
      setOpen(false);
      onSubmitted?.();
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit}>
        <SearchIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          className="pr-9"
        />
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {isLoading ? (
            <div className="p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : flatResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              نتیجه‌ای یافت نشد
            </div>
          ) : (
            <>
              {/* First item: search for "{query}" */}
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => submit(query)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-right text-sm transition-colors",
                  activeIndex === 0 ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <SearchIcon className="size-4 text-muted-foreground" />
                <span className="flex-1">
                  جستجوی <span className="font-bold">«{query}»</span>
                </span>
                <span className="text-xs text-muted-foreground">در همه محصولات</span>
              </button>

              {flatResults.map((item, idx) => {
                const i = idx + 1;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={getHref(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      setOpen(false);
                      onSubmitted?.();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border/40 px-3 py-2 text-right text-sm transition-colors last:border-0",
                      activeIndex === i ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    {TYPE_ICON[item.type]}
                    <span className="flex-1 truncate text-foreground">{item.title}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {TYPE_LABEL[item.type]}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
