"use client";

import * as React from "react";
import { FolderTree, ChevronLeft, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

interface CategoryTreeSelectProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  className?: string;
  placeholder?: string;
}

export function CategoryTreeSelect({ categories, selectedIds, onChange, className, placeholder = "انتخاب دسته‌بندی‌ها..." }: CategoryTreeSelectProps) {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());
  const toggleExpand = (id: number) => setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  const toggleSelect = (id: number) => onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);

  return (
    <div className={cn("rounded-lg border border-input bg-background p-2", className)}>
      <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><FolderTree className="size-4 text-primary" />{placeholder}</span>
        {selectedIds.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary nums-fa">{selectedIds.length} انتخاب شده</span>}
      </div>
      <div className="max-h-48 space-y-0.5 overflow-y-auto">
        {categories.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">دسته‌بندی‌ای موجود نیست</p> : categories.map((cat) => (
          <CategoryNode key={cat.id} category={cat} depth={0} expanded={expanded} onToggleExpand={toggleExpand} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
        ))}
      </div>
    </div>
  );
}

function CategoryNode({ category, depth, expanded, onToggleExpand, selectedIds, onToggleSelect }: any) {
  const hasChildren = category.children?.length > 0;
  const isExpanded = expanded.has(category.id);
  const isSelected = selectedIds.includes(category.id);
  return (
    <>
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent/40" style={{ paddingRight: `${depth * 16 + 8}px` }}>
        {hasChildren ? <button type="button" onClick={() => onToggleExpand(category.id)} className="flex size-4 items-center justify-center text-muted-foreground">{isExpanded ? <ChevronDown className="size-3" /> : <ChevronLeft className="size-3" />}</button> : <span className="w-4" />}
        <button type="button" onClick={() => onToggleSelect(category.id)} className={cn("flex size-4 shrink-0 items-center justify-center rounded border", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{isSelected && <Check className="size-3" />}</button>
        <button type="button" onClick={() => onToggleSelect(category.id)} className="flex-1 truncate text-right text-sm text-foreground">{category.name}</button>
        {!category.isActive && <span className="text-[10px] text-muted-foreground">غیرفعال</span>}
      </div>
      {isExpanded && hasChildren && category.children.map((child: any) => <CategoryNode key={child.id} category={child} depth={depth + 1} expanded={expanded} onToggleExpand={onToggleExpand} selectedIds={selectedIds} onToggleSelect={onToggleSelect} />)}
    </>
  );
}
