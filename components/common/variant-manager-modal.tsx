"use client";

import * as React from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VariantBuilder, type VariantFormData } from "@/components/common/variant-builder";
import { productsService } from "@/services";
import type { Attribute, ProductVariant } from "@/types/domain";
import { toPersianDigits } from "@/utils/format";

interface VariantManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  /** Existing variants loaded from the product. */
  existingVariants: ProductVariant[];
  /** All available attributes (from GET /attributes). */
  attributes: Attribute[];
  basePrice: number;
  /** Called after variants are successfully saved. */
  onSaved: (variants: ProductVariant[]) => void;
}

/**
 * Modal for managing ALL variants of a product in one place.
 *
 * Works exactly like the VariantBuilder in the "new product" page:
 *   1. Select variant attributes → combinations auto-generate
 *   2. Edit each combination (SKU, stock, priceAdjustment, weight, isDefault, isActive)
 *   3. On "Save": diff against existing variants and call:
 *      - POST /products/:id/variants for NEW variants (no ID)
 *      - PUT /products/:id/variants/:variantId for MODIFIED variants
 *      - DELETE /products/:id/variants/:variantId for REMOVED variants
 */
export function VariantManagerModal({
  open,
  onOpenChange,
  productId,
  existingVariants,
  attributes,
  basePrice,
  onSaved,
}: VariantManagerModalProps) {
  const [variants, setVariants] = React.useState<VariantFormData[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const initializedRef = React.useRef(false);

  // Initialize variants from existingVariants when modal opens.
  React.useEffect(() => {
    if (open && !initializedRef.current) {
      const formData: VariantFormData[] = existingVariants.map((v) => {
        // Extract attributeValueIds: backend returns [] but attributeValues has the data.
        const avIds =
          v.attributeValueIds.length > 0
            ? v.attributeValueIds
            : (v.attributeValues ?? []).map((av) => av.id);
        return {
          id: v.id,
          sku: v.sku,
          priceAdjustment: v.priceAdjustment,
          stock: v.stock,
          weight: v.weight ?? undefined,
          isDefault: v.isDefault,
          isActive: v.isActive,
          attributeValueIds: avIds,
        };
      });
      setVariants(formData);
      initializedRef.current = true;
    }
    if (!open) {
      initializedRef.current = false;
      setError(null);
    }
  }, [open, existingVariants]);

  // Build a map of existing variants by ID for diffing.
  const existingMap = React.useMemo(() => {
    const map = new Map<number, ProductVariant>();
    for (const v of existingVariants) map.set(v.id, v);
    return map;
  }, [existingVariants]);

  const handleSave = async () => {
    if (variants.length === 0) {
      setError("حداقل یک تنوع الزامی است");
      return;
    }
    // Ensure exactly one default
    if (!variants.some((v) => v.isDefault)) {
      variants[0].isDefault = true;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedVariants: ProductVariant[] = [];
      const currentIds = new Set(
        variants.filter((v) => v.id != null).map((v) => v.id as number),
      );

      // 1. DELETE removed variants (existed before but not in current list)
      for (const existing of existingVariants) {
        if (!currentIds.has(existing.id)) {
          try {
            await productsService.deleteVariant(productId, existing.id);
          } catch (e: unknown) {
            const apiErr = e as { message?: string };
            // If variant has orders, it can't be deleted — keep it.
            toast.warning(`تنوع ${existing.sku} حذف نشد: ${apiErr?.message ?? "ممکن است در سفارش استفاده شده باشد"}`);
            updatedVariants.push(existing);
          }
        }
      }

      // 2. POST new variants + PUT modified variants
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const sku =
          v.sku.trim() || `SKU-${productId}-${i + 1}-${Date.now().toString(36).slice(-4)}`;
        const payload = {
          sku,
          priceAdjustment: Number(v.priceAdjustment) || 0,
          stock: Number(v.stock) || 0,
          weight: v.weight,
          isDefault: v.isDefault,
          isActive: v.isActive,
          attributeValueIds: v.attributeValueIds,
        };

        if (v.id != null) {
          // Existing variant — check if changed
          const original = existingMap.get(v.id);
          const changed =
            !original ||
            original.sku !== payload.sku ||
            original.priceAdjustment !== payload.priceAdjustment ||
            original.stock !== payload.stock ||
            (original.weight ?? null) !== (payload.weight ?? null) ||
            original.isDefault !== payload.isDefault ||
            original.isActive !== payload.isActive;

          if (changed) {
            try {
              const updated = await productsService.updateVariant(productId, v.id, payload);
              updatedVariants.push(updated);
            } catch (e: unknown) {
              const apiErr = e as { message?: string };
              toast.error(`خطا در ذخیره تنوع ${v.sku}: ${apiErr?.message ?? ""}`);
              updatedVariants.push(original ?? v as unknown as ProductVariant);
            }
          } else {
            // No change — keep original
            updatedVariants.push(original);
          }
        } else {
          // New variant — POST
          try {
            const created = await productsService.addVariant(productId, payload);
            updatedVariants.push(created);
          } catch (e: unknown) {
            const apiErr = e as { message?: string };
            toast.error(`خطا در ایجاد تنوع ${v.sku}: ${apiErr?.message ?? ""}`);
          }
        }
      }

      toast.success("تنوع‌ها ذخیره شدند");
      onSaved(updatedVariants);
      onOpenChange(false);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      setError(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مدیریت تنوع‌ها</DialogTitle>
          <DialogDescription>
            ویژگی‌های تنوع را انتخاب کنید. تمام ترکیب‌های ممکن به‌صورت خودکار تولید می‌شوند.
            تغییرات با دکمه «ذخیره تنوع‌ها» اعمال می‌شوند.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <VariantBuilder
            variants={variants}
            onChange={setVariants}
            attributes={attributes}
            basePrice={basePrice}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Badge variant="secondary" className="nums-fa">
            {toPersianDigits(variants.length)} تنوع
          </Badge>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              انصراف
            </Button>
            <Button onClick={handleSave} disabled={saving || variants.length === 0}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "در حال ذخیره..." : "ذخیره تنوع‌ها"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
