"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Check } from "lucide-react";

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
import { MultiSelectCombobox } from "@/components/common/multi-select-combobox";
import { useProductFilters } from "@/features/catalog/hooks/use-product-filters";
import { toPersianDigits, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  categorySlug?: string;
}

export function FilterSidebar({ categorySlug }: FilterSidebarProps) {
  const { data: filters, isLoading } = useProductFilters(categorySlug);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedBrandIds = searchParams.get("brandIds")?.split(",").filter(Boolean) ?? [];
  const selectedAttrValueIds = searchParams.get("attributeValueIds")?.split(",").filter(Boolean) ?? [];

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const toggleBrand = (brandId: string) => {
    const next = selectedBrandIds.includes(brandId)
      ? selectedBrandIds.filter((b) => b !== brandId)
      : [...selectedBrandIds, brandId];
    updateParams({ brandIds: next.length ? next.join(",") : null });
  };

  const toggleAttributeValue = (valueId: string) => {
    const next = selectedAttrValueIds.includes(valueId)
      ? selectedAttrValueIds.filter((v) => v !== valueId)
      : [...selectedAttrValueIds, valueId];
    updateParams({ attributeValueIds: next.length ? next.join(",") : null });
  };

  const toggleBoolean = (key: "inStock" | "hasDiscount") => {
    const current = searchParams.get(key) === "true";
    updateParams({ [key]: current ? null : "true" });
  };

  const setPrice = (which: "min" | "max", value: string) => {
    updateParams({ [which === "min" ? "minPrice" : "maxPrice"]: value || null });
  };

  const isBrandChecked = (id: string) => selectedBrandIds.includes(id);
  const isAttrChecked = (id: string) => selectedAttrValueIds.includes(id);

  const hasActiveFilters =
    selectedBrandIds.length > 0 ||
    selectedAttrValueIds.length > 0 ||
    searchParams.get("inStock") === "true" ||
    searchParams.get("hasDiscount") === "true" ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <SlidersHorizontal className="size-4 text-primary" />
          فیلترها
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => router.replace("/products", { scroll: false })}
          >
            <X className="size-3" />
            پاک کردن همه
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {/* Quick filters */}
        <FilterSection title="وضعیت">
          <FilterCheckbox
            label="فقط کالاهای موجود"
            checked={searchParams.get("inStock") === "true"}
            onChange={() => toggleBoolean("inStock")}
          />
          <FilterCheckbox
            label="فقط کالاهای تخفیف‌دار"
            checked={searchParams.get("hasDiscount") === "true"}
            onChange={() => toggleBoolean("hasDiscount")}
          />
        </FilterSection>

        <Separator className="my-3" />

        {/* Price range */}
        {filters && filters.priceRange.max > 0 && (
          <>
            <FilterSection title="بازه قیمت">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="حداقل"
                    value={searchParams.get("minPrice") ?? ""}
                    onChange={(e) => setPrice("min", e.target.value)}
                    className="h-9 text-xs"
                    dir="ltr"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="حداکثر"
                    value={searchParams.get("maxPrice") ?? ""}
                    onChange={(e) => setPrice("max", e.target.value)}
                    className="h-9 text-xs"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  بازه: {formatPrice(filters.priceRange.min)} تا {formatPrice(filters.priceRange.max)} تومان
                </p>
              </div>
            </FilterSection>
            <Separator className="my-3" />
          </>
        )}

        {/* Brands as combobox */}
        {isLoading ? (
          <FilterSection title="برندها">
            <Skeleton className="h-9 w-full" />
          </FilterSection>
        ) : filters && filters.brands.length > 0 ? (
          <>
            <FilterSection title="برندها">
              <MultiSelectCombobox
                options={filters.brands.map((b) => ({ value: String(b.id), label: b.name }))}
                value={selectedBrandIds}
                onChange={(vals) => {
                  const current = selectedBrandIds;
                  // Find what changed
                  const added = vals.find((v) => !current.includes(v));
                  const removed = current.find((v) => !vals.includes(v));
                  if (added) toggleBrand(added);
                  if (removed) toggleBrand(removed);
                }}
                placeholder="انتخاب برند..."
                searchPlaceholder="جست‌وجوی برند..."
                emptyText="بری یافت نشد"
              />
            </FilterSection>
            <Separator className="my-3" />
          </>
        ) : null}

        {/* Dynamic attributes as comboboxes */}
        {filters && filters.attributes.length > 0 && (
          <Accordion type="multiple" defaultValue={filters.attributes.slice(0, 3).map((a) => String(a.id))}>
            {filters.attributes.map((attr) => (
              <AccordionItem key={attr.id} value={String(attr.id)} className="border-b-0">
                <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
                  {attr.name}
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1">
                  {attr.values.length > 5 ? (
                    <MultiSelectCombobox
                      options={attr.values.map((v) => ({
                        value: String(v.id),
                        label: v.value,
                        colorHex: v.colorHex,
                      }))}
                      value={selectedAttrValueIds.filter((id) =>
                        attr.values.some((v) => String(v.id) === id),
                      )}
                      onChange={(vals) => {
                        // Replace this attribute's selections
                        const otherAttrs = selectedAttrValueIds.filter((id) =>
                          !attr.values.some((v) => String(v.id) === id),
                        );
                        const next = [...otherAttrs, ...vals];
                        updateParams({
                          attributeValueIds: next.length ? next.join(",") : null,
                        });
                      }}
                      placeholder={`انتخاب ${attr.name}...`}
                      searchPlaceholder={`جست‌وجو...`}
                      emptyText="موردی یافت نشد"
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {attr.values.map((v) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`attr-${v.id}`}
                            checked={isAttrChecked(String(v.id))}
                            onCheckedChange={() => toggleAttributeValue(String(v.id))}
                          />
                          <Label
                            htmlFor={`attr-${v.id}`}
                            className="flex items-center gap-2 text-sm font-normal text-muted-foreground cursor-pointer"
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
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
      <div className="space-y-1.5">{children}</div>
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
