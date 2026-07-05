"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiSelectCombobox } from "@/components/common/multi-select-combobox";
import type { Attribute } from "@/types/domain";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

export interface VariantFormData {
  id?: number; sku: string; priceAdjustment: number;
  stock: number; isDefault: boolean; attributeValueIds: number[];
}

interface VariantBuilderProps {
  variants: VariantFormData[]; onChange: (v: VariantFormData[]) => void; attributes: Attribute[];
}

export function VariantBuilder({ variants, onChange, attributes }: VariantBuilderProps) {
  const variantAttributes = attributes.filter((a) => a.isVariant);
  const addVariant = () => onChange([...variants, { sku: "", priceAdjustment: 0, stock: 0, isDefault: variants.length === 0, attributeValueIds: [] }]);
  const removeVariant = (i: number) => { if (variants.length <= 1) return; const n = variants.filter((_, idx) => idx !== i); if (!n.some((v) => v.isDefault)) n[0].isDefault = true; onChange(n); };
  const updateVariant = (i: number, u: Partial<VariantFormData>) => onChange(variants.map((v, idx) => idx === i ? { ...v, ...u } : v));
  const setDefault = (i: number) => onChange(variants.map((v, idx) => ({ ...v, isDefault: idx === i })));

  return (
    <div className="space-y-3">
      {variantAttributes.length === 0 && <p className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-400">هنوز ویژگی variant تعریف نشده. از بخش ویژگی‌ها ایجاد کنید.</p>}
      {variants.map((variant, index) => (
        <VariantRow key={index} variant={variant} index={index} attributes={variantAttributes} onChange={(u) => updateVariant(index, u)} onRemove={() => removeVariant(index)} onSetDefault={() => setDefault(index)} canRemove={variants.length > 1} />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full"><Plus className="size-4" />افزودن تنوع</Button>
    </div>
  );
}

function VariantRow({ variant, index, attributes, onChange, onRemove, onSetDefault, canRemove }: any) {
  return (
    <div className={cn("rounded-lg border p-3", variant.isDefault ? "border-primary/40 bg-primary/5" : "border-border")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary nums-fa">{toPersianDigits(index + 1)}</span>
          {variant.isDefault ? <Badge variant="default" className="text-[10px]">پیش‌فرض</Badge> : <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={onSetDefault}>تنظیم به‌عنوان پیش‌فرض</Button>}
        </div>
        {canRemove && <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="size-3.5" /></Button>}
      </div>
      {attributes.length > 0 && (
        <div className="mb-3 space-y-2">
          {attributes.map((attr: Attribute) => {
            const selectedForAttr = variant.attributeValueIds.filter((id: number) => attr.values.some((v) => v.id === id));
            return (
              <div key={attr.id} className="grid grid-cols-[120px_1fr] items-center gap-2">
                <Label className="text-xs text-muted-foreground">{attr.name}:</Label>
                <MultiSelectCombobox options={attr.values.map((v) => ({ value: String(v.id), label: v.value, colorHex: v.colorHex }))} value={selectedForAttr.map(String)} onChange={(vals: string[]) => { const other = variant.attributeValueIds.filter((id: number) => !attr.values.some((v) => v.id === id)); onChange({ attributeValueIds: [...other, ...vals.map(Number)] }); }} placeholder={`انتخاب ${attr.name}...`} searchPlaceholder="جست‌وجو..." emptyText="موردی یافت نشد" />
              </div>
            );
          })}
        </div>
      )}
      <Separator className="mb-3" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={variant.sku} onChange={(e) => onChange({ sku: e.target.value })} placeholder="SKU" dir="ltr" className="h-8 text-xs" /></div>
        <div className="space-y-1"><Label className="text-xs">اضافه قیمت (تومان)</Label><Input type="number" value={variant.priceAdjustment} onChange={(e) => onChange({ priceAdjustment: Number(e.target.value) })} dir="ltr" className="h-8 text-xs" /></div>
        <div className="space-y-1"><Label className="text-xs">موجودی</Label><Input type="number" value={variant.stock} onChange={(e) => onChange({ stock: Number(e.target.value) })} dir="ltr" className="h-8 text-xs" /></div>
      </div>
    </div>
  );
}
