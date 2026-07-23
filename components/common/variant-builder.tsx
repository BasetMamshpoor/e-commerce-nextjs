"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectCombobox } from "@/components/common/multi-select-combobox";
import type {
  Attribute,
  AttributeValue,
  AttributeModifierType,
  ProductPricingMode,
  VariantAttributeValue,
} from "@/types/domain";
import { toPersianDigits, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * A single variant combination.
 * Each variant is defined by its selected attribute values + stock + optional modifiers.
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
  /** Base price (in IRT) for showing effective price preview. Pass currentPriceIRT
   *  for CURRENCY_BASED products, or basePrice for FIXED_IRT. */
  basePrice?: number;
  /** Pricing mode — controls which modifier types are available. */
  pricingMode?: ProductPricingMode;
}

const MODIFIER_OPTIONS_BASE = [
  { value: "none", label: "بدون تأثیر" },
  { value: "PERCENTAGE", label: "درصد" },
  { value: "FIXED_IRT", label: "مبلغ ثابت (تومان)" },
];

const MODIFIER_OPTIONS_CURRENCY = [
  ...MODIFIER_OPTIONS_BASE,
  { value: "FIXED_SOURCE_CURRENCY", label: "مبلغ ثابت (ارز مبدأ)" },
];

/**
 * VariantBuilder — generates all combinations from selected variant attributes.
 *
 * Flow:
 *   1. Admin selects which variant attributes to use (e.g., Color, Size) and their values
 *      (e.g., Red, Blue; S, XL) via multi-select comboboxes.
 *   2. Frontend auto-generates all combinations (Cartesian product).
 *   3. For each combination, admin enters: SKU, Stock, Weight.
 *   4. Per-attribute-value price modifiers can be set in an expandable "تنظیمات قیمت" section.
 *   5. One combination is marked as default. All are active by default.
 */
export function VariantBuilder({
  variants,
  onChange,
  attributes,
  basePrice = 0,
  pricingMode = "FIXED_IRT",
}: VariantBuilderProps) {
  const variantAttributes = attributes.filter((a) => a.isVariant);
  const isCurrencyBased = pricingMode === "CURRENCY_BASED";
  const modifierOptions = isCurrencyBased
    ? MODIFIER_OPTIONS_CURRENCY
    : MODIFIER_OPTIONS_BASE;

  // Track which variants have their price-settings panel expanded.
  const [expandedPanels, setExpandedPanels] = React.useState<Set<number>>(new Set());

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

  // When selections change, regenerate combinations — preserve existing data + modifiers.
  React.useEffect(() => {
    const combos = generateCombinations();
    if (combos.length === 0) return;

    // Build lookup of existing variants by sorted attributeValueIds
    const existingMap = new Map<string, VariantFormData>();
    for (const v of variants) {
      const ids = v.attributeValues.map((av) => av.attributeValueId);
      const key = [...ids].sort((a, b) => a - b).join(",");
      existingMap.set(key, v);
    }

    const newVariants: VariantFormData[] = combos.map((combo, index) => {
      const key = [...combo].sort((a, b) => a - b).join(",");
      const existing = existingMap.get(key);
      const isFirst = index === 0;

      // Preserve existing modifiers when regenerating.
      const attributeValues: VariantAttributeValue[] = combo.map((id) => {
        const existingAv = existing?.attributeValues.find(
          (av) => av.attributeValueId === id,
        );
        return (
          existingAv ?? { attributeValueId: id }
        );
      });

      return {
        sku: existing?.sku ?? "",
        priceAdjustment: existing?.priceAdjustment ?? 0,
        stock: existing?.stock ?? 0,
        weight: existing?.weight,
        isDefault: existing?.isDefault ?? isFirst,
        isActive: existing?.isActive ?? true,
        attributeValues,
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
      variants.map((v) =>
        [...v.attributeValues.map((av) => av.attributeValueId)].sort((a, b) => a - b).join(","),
      ),
    );
    const newKeys = new Set(
      newVariants.map((v) =>
        [...v.attributeValues.map((av) => av.attributeValueId)].sort((a, b) => a - b).join(","),
      ),
    );
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

  /** Update a single attribute value's modifier within a variant. */
  const updateAttributeModifier = (
    variantIndex: number,
    avIndex: number,
    field: "modifierType" | "modifierValue",
    value: string | number | null,
  ) => {
    onChange(
      variants.map((v, vi) => {
        if (vi !== variantIndex) return v;
        const newAttributeValues = v.attributeValues.map((av, ai) => {
          if (ai !== avIndex) return av;
          if (field === "modifierType") {
            const type = value === "none" || value === "" ? null : (value as AttributeModifierType);
            // When clearing the type, also clear the value.
            return {
              attributeValueId: av.attributeValueId,
              modifierType: type,
              modifierValue: type ? av.modifierValue ?? null : null,
            };
          }
          return {
            ...av,
            modifierValue: value === "" ? null : (value as number),
          };
        });
        return { ...v, attributeValues: newAttributeValues };
      }),
    );
  };

  const togglePanel = (index: number) => {
    setExpandedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
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

  /** Get attribute name + value label for a given attributeValueId. */
  const getAttrValueInfo = (avId: number): { attrName: string; value: string; colorHex?: string | null } | null => {
    for (const attr of variantAttributes) {
      const val = attr.values.find((v) => v.id === avId);
      if (val) return { attrName: attr.name, value: val.value, colorHex: val.colorHex };
    }
    return null;
  };

  /** Count how many modifiers are set in a variant. */
  const countModifiers = (variant: VariantFormData): number =>
    variant.attributeValues.filter((av) => av.modifierType).length;

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
        </p>
        <div className="space-y-3">
          {variantAttributes.map((attr) => {
            const selected = selections[attr.id] ?? [];
            return (
              <div key={attr.id} className="grid grid-cols-[100px_1fr] items-center gap-2 sm:grid-cols-[140px_1fr]">
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

      {/* Step 2: Generated variants as cards */}
      {hasSelections ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              ۲
            </span>
            ترکیب‌های تولیدشده
            <Badge variant="secondary" className="text-[10px] nums-fa">
              {toPersianDigits(variants.length)} تنوع
            </Badge>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ترکیبی تولید نشد. مقادیر ویژگی‌ها را انتخاب کنید.
            </p>
          ) : (
            <div className="space-y-2">
              {variants.map((variant, index) => {
                const isExpanded = expandedPanels.has(index);
                const modifierCount = countModifiers(variant);
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border transition-colors",
                      variant.isDefault ? "border-primary/40 bg-primary/5" : "border-border",
                      !variant.isActive && "opacity-60",
                    )}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between gap-2 p-2.5">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        {variant.attributeValues.length > 0 ? (
                          variant.attributeValues.map((av, ai) => {
                            const info = getAttrValueInfo(av.attributeValueId);
                            return (
                              <React.Fragment key={ai}>
                                {ai > 0 && <span className="text-muted-foreground text-[10px]">+</span>}
                                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                  {info?.colorHex && (
                                    <span
                                      className="size-2 rounded-full border border-border"
                                      style={{ backgroundColor: info.colorHex }}
                                    />
                                  )}
                                  {info ? `${info.attrName}: ${info.value}` : `#${av.attributeValueId}`}
                                </span>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-muted-foreground">بدون ویژگی</span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                          className="size-4 rounded"
                          title="فعال"
                        />
                        <input
                          type="radio"
                          checked={variant.isDefault}
                          onChange={() => setDefault(index)}
                          className="size-4"
                          title="پیش‌فرض"
                        />
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
                      </div>
                    </div>

                    {/* Card body: basic fields */}
                    <div className="grid grid-cols-3 gap-2 px-2.5 pb-2.5">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">SKU</Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, { sku: e.target.value })}
                          placeholder="خودکار"
                          dir="ltr"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">موجودی</Label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                          dir="ltr"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">وزن (kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.weight ?? ""}
                          onChange={(e) =>
                            updateVariant(index, { weight: e.target.value ? Number(e.target.value) : undefined })
                          }
                          dir="ltr"
                          className="h-8 text-xs"
                          placeholder="—"
                        />
                      </div>
                    </div>

                    {/* Expandable price settings */}
                    {variant.attributeValues.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePanel(index)}
                          className="flex w-full items-center justify-between border-t border-border/40 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent/50"
                        >
                          <span className="flex items-center gap-1.5">
                            <Tag className="size-3" />
                            تنظیمات قیمت
                            {modifierCount > 0 && (
                              <Badge variant="secondary" className="text-[9px]">
                                {toPersianDigits(modifierCount)} modifier
                              </Badge>
                            )}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronLeft className="size-3 rotate-180" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="space-y-2 border-t border-border/40 p-2.5">
                            {variant.attributeValues.map((av, avIndex) => {
                              const info = getAttrValueInfo(av.attributeValueId);
                              const currentModifierType = av.modifierType ?? "none";
                              return (
                                <div
                                  key={avIndex}
                                  className="grid grid-cols-[1fr_120px_100px] items-center gap-1.5"
                                >
                                  {/* Attribute value label */}
                                  <div className="flex items-center gap-1.5 text-xs">
                                    {info?.colorHex && (
                                      <span
                                        className="size-2.5 shrink-0 rounded-full border border-border"
                                        style={{ backgroundColor: info.colorHex }}
                                      />
                                    )}
                                    <span className="truncate text-muted-foreground">
                                      {info ? info.value : `#${av.attributeValueId}`}
                                    </span>
                                  </div>

                                  {/* Modifier type select */}
                                  <Select
                                    value={currentModifierType}
                                    onValueChange={(v) =>
                                      updateAttributeModifier(index, avIndex, "modifierType", v)
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {modifierOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value} className="text-xs">
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {/* Modifier value input */}
                                  {av.modifierType ? (
                                    <Input
                                      type="number"
                                      value={av.modifierValue ?? ""}
                                      onChange={(e) =>
                                        updateAttributeModifier(
                                          index,
                                          avIndex,
                                          "modifierValue",
                                          e.target.value === "" ? "" : Number(e.target.value),
                                        )
                                      }
                                      placeholder={
                                        av.modifierType === "PERCENTAGE"
                                          ? "مثلاً 10-"
                                          : av.modifierType === "FIXED_SOURCE_CURRENCY"
                                            ? "مثلاً 5"
                                            : "مثلاً 50000"
                                      }
                                      step={
                                        av.modifierType === "PERCENTAGE" ? "1" : "1000"
                                      }
                                      dir="ltr"
                                      className="h-7 text-[11px] nums-fa"
                                    />
                                  ) : (
                                    <div />
                                  )}
                                </div>
                              );
                            })}

                            {/* Modifier hints */}
                            <div className="space-y-0.5 pt-1">
                              <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">درصد:</span> مثبت = گران‌تر، منفی = ارزان‌تر (روی قیمت پایه اعمال می‌شود)
                              </p>
                              {isCurrencyBased && (
                                <p className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">ارز مبدأ:</span> مبلغ ثابت به ارز محصول (مثلاً 5 = ۵ دلار)
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">تومان:</span> مبلغ ثابت به تومان (پس از تبدیل اعمال می‌شود)
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Effective price preview */}
                    {basePrice > 0 && (
                      <div className="border-t border-border/40 px-2.5 py-1.5">
                        <p className="text-[10px] text-success nums-fa">
                          قیمت پایه: {formatPrice(basePrice)} تومان
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
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
