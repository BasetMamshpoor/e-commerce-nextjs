"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import type { ProductSortOption } from "@/types/domain";

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "popular", label: "محبوب‌ترین" },
];

interface SortBarProps {
  value: ProductSortOption;
  onChange: (v: ProductSortOption) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (v: "grid" | "list") => void;
}

export function SortBar({ value, onChange, viewMode, onViewModeChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as ProductSortOption)}>
        <SelectTrigger className="w-[140px] lg:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="hidden items-center gap-1 lg:flex">
        <span className="text-xs text-muted-foreground">مرتب‌سازی:</span>
        {SORT_OPTIONS.map((o) => (
          <Button
            key={o.value}
            variant={value === o.value ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center rounded-lg border border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-l-none", viewMode === "grid" && "bg-primary/10 text-primary")}
          onClick={() => onViewModeChange("grid")}
          aria-label="نمایش شبکه‌ای"
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-r-none", viewMode === "list" && "bg-primary/10 text-primary")}
          onClick={() => onViewModeChange("list")}
          aria-label="نمایش لیستی"
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  );
}
