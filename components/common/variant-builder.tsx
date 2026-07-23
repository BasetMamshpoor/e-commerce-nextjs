"use client";

import * as React from "react";
import { Plus, Trash2, Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiSelectCombobox } from "@/components/common/multi-select-combobox";
import type { Attribute, AttributeValue, VariantAttributeValue } from "@/types/domain";
import { toPersianDigits, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * A single variant combination.
 * Each variant is defined by its selected attribute values + stock + priceAdjustment.
 */
export interface VariantFormData {
  id?: number;
  sku: string;
  priceAdjustment: number;
  stock: number;
  weight?: number;
  isDefault: boolean;
  isActive: boolean;
  /** Attribute values with optional per-variant price modifiers. */
  attributeValues: VariantAttributeValue[];
}

interface VariantBuilderProps {
  variants: VariantFormData[];
  onChange: (v: VariantFormData[]) => void;
  attributes: Attribute[];
  /** Base price for showing effective price preview. */
  basePrice?: number;
}

/**
 * VariantBuilder — generates all combinations from selected variant attributes.
 *
 * Flow:
 *   1. Admin selects which variant attributes to use (e.g., Color, Size) and their values
 *      (e.g., Red, Blue; S, XL) via multi-select comboboxes.
 *   2. Frontend auto-generates all combinations (Cartesian product).
 *   3. For each combination, admin enters: SKU (auto if empty), Stock, Price Adjustment, Weight.
 *   4. One combination is marked as default. All are active by default.
 *
 * If no variant attributes are selected, a single "no-variant" product is created
 * with basePrice as the price and a single variant with stock from the form.
 */
export function VariantBuilder({
  variants,
  onChange,
  attributes,
  basePrice = 0,
}: VariantBuilderProps) {
  const variantAttributes = attributes.filter((a) => a.isVariant);

  // Track selected attribute value IDs per attribute.
  const [selections, setSelections] = React.useState<Record<number, number[]>>(() => {
    if (variants.length === 0) return {};
    const map: Record<number, number[]> = {};
    for (const v of variants) {
      for (const av of v.attributeValues) {
        const avId = av.attributeValueId;
        for (const attr of variantAttributes) {
          if (attr.values.some((val) => val.id === avId)) {
            if (!map[attr.id]) map[attr.id] = [];
            if (!map[attr.id].includes(avId)) map[attr.id].push(avId);
          }
        }
      }
    }
    return map;
  });

  // Generate all combinations (Cartesian product) from selections.
  const generateCombinations = React.useCallback(() => {
    const attrIds = Object.keys(selections).map(Number);
    if (attrIds.length === 0) return [];

    const valueGroups: { attrId: number; values: AttributeValue[] }[] = [];
    for (const attrId of attrIds) {
      const attr = variantAttributes.find((a) => a.id === attrId);
      if (!attr) continue;
      const selectedValues = attr.values.filter((v) => selections[attrId]?.includes(v.id));
      if (selectedValues.length === 0) continue;
      valueGroups.push({ attrId, values: selectedValues });
    }

    if (valueGroups.length === 0) return [];

    let combinations: number[][] = valueGroups[0].values.map((v) => [v.id]);
    for (let i = 1; i < valueGroups.length; i++) {
      const newCombos: number[][] = [];
      for (const existing of combinations) {
        for (const val of valueGroups[i].values) {
          newCombos.push([...existing, val.id]);
        }
      }
      combinations = newCombos;
    }

    return combinations;
  }, [selections, variantAttributes]);

  // When selections change, regenerate combinations — preserve existing data.
  React.useEffect(() => {
    const combos = generateCombinations();
    if (combos.length === 0) return;

    // Build lookup of existing variants by sorted attributeValueIds
    const existingMap = new Map<string, VariantFormData>();
    for (const v of variants) {
      const ids = v.attributeValues.map(av => av.attributeValueId);
      const key = [...ids].sort((a, b) => a - b).join(",");
      existingMap.set(key, v);
    }

    const newVariants: VariantFormData[] = combos.map((combo, index) => {
      const key = [...combo].sort((a, b) => a - b).join(",");
      const existing = existingMap.get(key);
      const isFirst = index === 0;
      return {
        sku: existing?.sku ?? "",
        priceAdjustment: existing?.priceAdjustment ?? 0,
        stock: existing?.stock ?? 0,
        weight: existing?.weight,
        isDefault: existing?.isDefault ?? isFirst,
        isActive: existing?.isActive ?? true,
        attributeValues: combo.map(id => ({ attributeValueId: id })),
      };
    });

    // Ensure exactly one default
    const hasDefault = newVariants.some((v) => v.isDefault);
    if (!hasDefault && newVariants.length > 0) {
      newVariants[0].isDefault = true;
    } else if (hasDefault) {
      let foundDefault = false;
      for (const v of newVariants) {
        if (v.isDefault) {
          if (foundDefault) v.isDefault = false;
          foundDefault = true;
        }
      }
    }

    const oldKeys = new Set(
      variants.map((v) => [...v.attributeValues.map(av => av.attributeValueId)].sort((a, b) => a - b).join(",")),
    );
    const newKeys = new Set(newVariants.map((v) => [...v.attributeValues.map(av => av.attributeValueId)].sort((a, b) => a - b).join(",")));
    const changed =
      oldKeys.size !== newKeys.size ||
      [...oldKeys].some((k) => !newKeys.has(k));

    if (changed) {
      onChange(newVariants);
    }
     
  }, [selections]);

  const updateSelection = (attrId: number, valueIds: number[]) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (valueIds.length === 0) delete next[attrId];
      else next[attrId] = valueIds;
      return next;
    });
  };

  const updateVariant = (index: number, updates: Partial<VariantFormData>) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  const setDefault = (index: number) => {
    onChange(variants.map((v, i) => ({ ...v, isDefault: i === index })));
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    const removed = variants[index];
    const remaining = variants.filter((_, i) => i !== index);
    if (removed.isDefault && remaining.length > 0) remaining[0].isDefault = true;
    onChange(remaining);
  };

  /** Generate auto SKU from attribute values if SKU is empty. */
  const autoSku = (attributeValueIds: number[]): string => {
    const parts: string[] = [];
    for (const avId of attributeValueIds) {
      for (const attr of variantAttributes) {
        const val = attr.values.find((v) => v.id === avId);
        if (val) {
          // Use first 3 chars of value or colorHex
          const part = val.colorHex
            ? val.colorHex.replace("#", "").toUpperCase().slice(0, 3)
            : val.value.replace(/\s+/g, "").toUpperCase().slice(0, 5);
          parts.push(part);
          break;
        }
      }
    }
    return parts.join("-") || `SKU-${Date.now()}`;
  };

  const getComboLabels = (attributeValueIds: number[]): string[] => {
    const labels: string[] = [];
    for (const avId of attributeValueIds) {
      for (const attr of variantAttributes) {
        const val = attr.values.find((v) => v.id === avId);
        if (val) {
          labels.push(`${attr.name}: ${val.value}`);
          break;
        }
      }
    }
    return labels;
  };

  if (variantAttributes.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-950/20">
        <AlertCircle className="mx-auto mb-2 size-8 text-amber-500" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          هنوز ویژگی تنوع (Variant) تعریف نشده
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          ابتدا از بخش «ویژگی‌ها» یک ویژگی با نوع «تنوع» ایجاد کنید (مثلاً رنگ، سایز).
          <br />
          هر محصول باید حداقل یک تنوع داشته باشد — اگر ویژگی تنوعی تعریف نشده،
          یک تنوع پیش‌فرض بدون ویژگی ایجاد می‌شود.
        </p>
        {variants.length === 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              onChange([
                {
                  sku: "",
                  priceAdjustment: 0,
                  stock: 0,
                  isDefault: true,
                  isActive: true,
                  attributeValues: [],
                },
              ])
            }
          >
            <Plus className="size-4" />
            ایجاد تنوع بدون ویژگی
          </Button>
        )}
      </div>
    );
  }

  const hasSelections = Object.keys(selections).length > 0;

  return (
    <div className="space-y-4">
      {/* Step 1: Select variant attributes and values */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
            ۱
          </span>
          انتخاب ویژگی‌های تنوع
        </div>
        <p className="text-xs text-muted-foreground">
          برای هر ویژگی تنوع، مقادیر مورد نظر را انتخاب کنید. تمام ترکیب‌های ممکن به‌صورت خودکار تولید می‌شوند.
          هر محصول باید حداقل یک تنوع داشته باشد.
        </p>
        <div className="space-y-3">
          {variantAttributes.map((attr) => {
            const selected = selections[attr.id] ?? [];
            return (
              <div key={attr.id} className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-xs text-muted-foreground">{attr.name}:</Label>
                <MultiSelectCombobox
                  options={attr.values.map((v) => ({
                    value: String(v.id),
                    label: v.value,
                    colorHex: v.colorHex,
                  }))}
                  value={selected.map(String)}
                  onChange={(vals: string[]) => updateSelection(attr.id, vals.map(Number))}
                  placeholder={`انتخاب ${attr.name}...`}
                  searchPlaceholder="جست‌وجو..."
                  emptyText="موردی یافت نشد"
                />
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Step 2: Generated combinations */}
      {hasSelections ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                ۲
              </span>
              ترکیب‌های تولیدشده
              <Badge variant="secondary" className="text-[10px] nums-fa">
                {toPersianDigits(variants.length)} تنوع
              </Badge>
            </div>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ترکیبی تولید نشد. مقادیر ویژگی‌ها را انتخاب کنید.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Desktop: table */}
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">ترکیب</th>
                      <th className="w-32 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">SKU</th>
                      <th className="w-20 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">موجودی</th>
                      <th className="w-24 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">افزایش قیمت</th>
                      <th className="w-20 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">وزن (kg)</th>
                      <th className="w-16 px-3 py-2 text-center text-xs font-semibold text-muted-foreground">فعال</th>
                      <th className="w-16 px-3 py-2 text-center text-xs font-semibold text-muted-foreground">پیش‌فرض</th>
                      <th className="w-10 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => {
                      const labels = getComboLabels(variant.attributeValues.map(av => av.attributeValueId));
                      const effectivePrice = basePrice + (variant.priceAdjustment || 0);
                      return (
                        <tr key={index} className={cn("border-b border-border/40 last:border-0", variant.isDefault && "bg-primary/5")}>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-1">
                              {labels.map((label, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <span className="text-muted-foreground">+</span>}
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{label}</span>
                                </React.Fragment>
                              ))}
                              {basePrice > 0 && (
                                <span className="mr-2 text-[10px] text-success nums-fa">
                                  {formatPrice(effectivePrice)} ت
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, { sku: e.target.value })}
                              placeholder="خودکار"
                              dir="ltr"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                              dir="ltr"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={variant.priceAdjustment}
                              onChange={(e) => updateVariant(index, { priceAdjustment: Number(e.target.value) })}
                              dir="ltr"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.weight ?? ""}
                              onChange={(e) => updateVariant(index, { weight: e.target.value ? Number(e.target.value) : undefined })}
                              dir="ltr"
                              className="h-8 text-xs"
                              placeholder="—"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                              className="size-4 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="radio"
                              checked={variant.isDefault}
                              onChange={() => setDefault(index)}
                              className="size-4"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeVariant(index)}
                              disabled={variants.length <= 1}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="space-y-2 md:hidden">
                {variants.map((variant, index) => {
                  const labels = getComboLabels(variant.attributeValues.map(av => av.attributeValueId));
                  const effectivePrice = basePrice + (variant.priceAdjustment || 0);
                  return (
                    <div key={index} className={cn("rounded-lg border p-3", variant.isDefault ? "border-primary/40 bg-primary/5" : "border-border")}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1">
                          {labels.map((label, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-muted-foreground">+</span>}
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{label}</span>
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <input type="checkbox" checked={variant.isActive} onChange={(e) => updateVariant(index, { isActive: e.target.checked })} className="size-4 rounded" title="فعال" />
                          <input type="radio" checked={variant.isDefault} onChange={() => setDefault(index)} className="size-4" title="پیش‌فرض" />
                          <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removeVariant(index)} disabled={variants.length <= 1}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">SKU</Label>
                          <Input value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} placeholder="خودکار" dir="ltr" className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">موجودی</Label>
                          <Input type="number" value={variant.stock} onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })} dir="ltr" className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">افزایش قیمت</Label>
                          <Input type="number" value={variant.priceAdjustment} onChange={(e) => updateVariant(index, { priceAdjustment: Number(e.target.value) })} dir="ltr" className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">وزن (kg)</Label>
                          <Input type="number" step="0.01" value={variant.weight ?? ""} onChange={(e) => updateVariant(index, { weight: e.target.value ? Number(e.target.value) : undefined })} dir="ltr" className="h-8 text-xs" placeholder="—" />
                        </div>
                      </div>
                      {basePrice > 0 && (
                        <p className="mt-1 text-[10px] text-success nums-fa">
                          قیمت نهایی: {formatPrice(effectivePrice)} تومان
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Layers className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            ویژگی‌های تنوع را انتخاب کنید تا ترکیب‌ها تولید شوند.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            هر محصول باید حداقل یک تنوع داشته باشد.
          </p>
        </div>
      )}
    </div>
  );
}
