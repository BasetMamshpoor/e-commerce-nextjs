"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductFilters } from "@/features/catalog/hooks/use-product-filters";
import { toPersianDigits, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  /** Currently-applied category slug (from URL). */
  categorySlug?: string;
  /** Show "all categories" navigation block at top. */
  showCategoryNavigation?: boolean;
}

/**
 * Filter sidebar for the shop page.
 *
 * URL-driven: every change updates ?brandIds=, ?minPrice=, etc. in the URL.
 * This makes filters shareable + SSR-friendly.
 */
export function FilterSidebar({ categorySlug, showCategoryNavigation = true }: FilterSidebarProps) {
  const { data: filters, isLoading } = useProductFilters(categorySlug);
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Helpers to mutate URL params */
  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page"); // reset pagination on filter change
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const toggleBrand = (brandId: string) => {
    const current = searchParams.get("brandIds")?.split(",").filter(Boolean) ?? [];
    const next = current.includes(brandId)
      ? current.filter((b) => b !== brandId)
      : [...current, brandId];
    updateParam("brandIds", next.length ? next.join(",") : null);
  };

  const toggleAttributeValue = (valueId: string) => {
    const current = searchParams.get("attributeValueIds")?.split(",").filter(Boolean) ?? [];
    const next = current.includes(valueId)
      ? current.filter((v) => v !== valueId)
      : [...current, valueId];
    updateParam("attributeValueIds", next.length ? next.join(",") : null);
  };

  const setPrice = (which: "min" | "max", value: string) => {
    updateParam(which === "min" ? "minPrice" : "maxPrice", value || null);
  };

  const toggleBoolean = (key: "inStock" | "hasDiscount", value: boolean) => {
    const current = searchParams.get(key) === "true";
    if (current === value) {
      updateParam(key, null);
    } else {
      updateParam(key, String(value));
    }
  };

  const isBrandChecked = (id: string) =>
    (searchParams.get("brandIds")?.split(",") ?? []).includes(id);
  const isAttrChecked = (id: string) =>
    (searchParams.get("attributeValueIds")?.split(",") ?? []).includes(id);

  return (
    <div className="space-y-4">
      {/* Reset all */}
      <ActiveFiltersReset />

      {/* In stock / has discount quick filters */}
      <FilterGroup title="وضعیت">
        <FilterCheckbox
          label="فقط کالاهای موجود"
          checked={searchParams.get("inStock") === "true"}
          onChange={() => toggleBoolean("inStock", true)}
        />
        <FilterCheckbox
          label="فقط کالاهای تخفیف‌دار"
          checked={searchParams.get("hasDiscount") === "true"}
          onChange={() => toggleBoolean("hasDiscount", true)}
        />
      </FilterGroup>

      {/* Price range */}
      {filters && filters.priceRange.max > 0 && (
        <FilterGroup title="بازه قیمت">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="حداقل"
                value={searchParams.get("minPrice") ?? ""}
                onChange={(e) => setPrice("min", e.target.value)}
                className="text-xs"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="حداکثر"
                value={searchParams.get("maxPrice") ?? ""}
                onChange={(e) => setPrice("max", e.target.value)}
                className="text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              بازه فعلی: {formatPrice(filters.priceRange.min)} تا {formatPrice(filters.priceRange.max)} تومان
            </p>
          </div>
        </FilterGroup>
      )}

      {/* Brands */}
      {isLoading ? (
        <FilterGroup title="برندها">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </FilterGroup>
      ) : filters && filters.brands.length > 0 ? (
        <FilterGroup title="برندها">
          {filters.brands.map((b) => (
            <FilterCheckbox
              key={b.id}
              label={b.name}
              checked={isBrandChecked(b.id)}
              onChange={() => toggleBrand(b.id)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {/* Dynamic attributes */}
      {filters && filters.attributes.length > 0 && (
        <Accordion type="multiple" defaultValue={filters.attributes.slice(0, 3).map((a) => a.id)}>
          {filters.attributes.map((attr) => (
            <AccordionItem key={attr.id} value={attr.id} className="border-b border-border/60">
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                {attr.name}
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {attr.values.map((v) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`attr-${v.id}`}
                      checked={isAttrChecked(v.id)}
                      onCheckedChange={() => toggleAttributeValue(v.id)}
                    />
                    <Label
                      htmlFor={`attr-${v.id}`}
                      className="flex items-center gap-2 text-sm font-normal text-muted-foreground"
                    >
                      {attr.inputType === "COLOR" && v.colorHex ? (
                        <span
                          className="size-3.5 rounded-full border border-border"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      ) : null}
                      {v.value}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

/* ───────── Mobile sheet wrapper ───────── */

export function MobileFilterSheet(props: FilterSidebarProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="size-4" />
          فیلترها
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>فیلترها</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterSidebar {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ───────── Sub-components ───────── */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-1.5">{children}</div>
      <Separator className="my-2" />
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

function ActiveFiltersReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasFilters = Array.from(searchParams.keys()).some((k) =>
    ["brandIds", "attributeValueIds", "minPrice", "maxPrice", "inStock", "hasDiscount", "search"].includes(k),
  );

  if (!hasFilters) return null;

  const activeChips: { label: string; key: string }[] = [];
  if (searchParams.get("inStock") === "true") activeChips.push({ label: "موجود", key: "inStock" });
  if (searchParams.get("hasDiscount") === "true") activeChips.push({ label: "تخفیف‌دار", key: "hasDiscount" });
  if (searchParams.get("minPrice")) activeChips.push({ label: `از ${toPersianDigits(searchParams.get("minPrice")!)}`, key: "minPrice" });
  if (searchParams.get("maxPrice")) activeChips.push({ label: `تا ${toPersianDigits(searchParams.get("maxPrice")!)}`, key: "maxPrice" });

  const removeChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {activeChips.map((c) => (
          <button
            key={c.key}
            onClick={() => removeChip(c.key)}
            className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground hover:bg-accent/80"
          >
            {c.label}
            <X className="size-3" />
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.replace("/products", { scroll: false })}
        className="h-7 w-full justify-center text-xs text-muted-foreground"
      >
        حذف همه فیلترها
      </Button>
      <Separator className="my-2" />
    </div>
  );
}
