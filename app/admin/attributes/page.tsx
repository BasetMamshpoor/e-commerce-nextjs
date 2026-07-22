"use client";

import * as React from "react";
import { Plus, Settings, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attributesService } from "@/services";
import type { Attribute, AttributeInputType, AttributeModifierType } from "@/types/domain";

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    attributesService.list().then(setAttributes).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این ویژگی؟")) return;
    try {
      await attributesService.delete(id);
      toast.success("ویژگی حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق — در تنوع محصول استفاده شده");
    }
  };

  const handleDeleteValue = async (attrId: number, valueId: number) => {
    try {
      await attributesService.deleteValue(valueId);
      toast.success("مقدار حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">ویژگی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت ویژگی‌های محصولات (رنگ، سایز، جنس و...)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          ویژگی جدید
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attributes.map((attr) => (
            <Card key={attr.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="size-4 text-primary" />
                  {attr.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(attr.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{attr.inputType}</Badge>
                  {attr.isFilterable && <Badge variant="secondary" className="text-xs">قابل فیلتر</Badge>}
                  {attr.isVariant && <Badge className="text-xs">تنوع</Badge>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {attr.values.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                      title={v.order ? `ترتیب: ${v.order}` : undefined}
                    >
                      {attr.inputType === "COLOR" && v.colorHex && (
                        <span
                          className="size-2.5 rounded-full border border-border"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      {v.value}
                      {v.order ? (
                        <span className="text-[10px] text-muted-foreground nums-fa">
                          ({v.order})
                        </span>
                      ) : null}
                      <button
                        onClick={() => handleDeleteValue(attr.id, v.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <AddValueForm attributeId={attr.id} inputType={attr.inputType} onAdded={load} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AttributeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={load}
      />
    </div>
  );
}

function AddValueForm({
  attributeId,
  inputType,
  onAdded,
}: {
  attributeId: number;
  inputType: AttributeInputType;
  onAdded: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [colorHex, setColorHex] = React.useState("");
  const [order, setOrder] = React.useState("");
  const [modifierType, setModifierType] = React.useState<AttributeModifierType | "">("");
  const [modifierValue, setModifierValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const isColor = inputType === "COLOR";

  const onAdd = async () => {
    if (!value.trim()) return;
    if (isColor && !colorHex.trim()) {
      toast.error("برای ویژگی رنگ، کد رنگ الزامی است");
      return;
    }
    if (modifierType && !modifierValue) {
      toast.error("مقدار modifier را وارد کنید یا نوع modifier را خالی بگذارید");
      return;
    }
    setSaving(true);
    try {
      await attributesService.addValue(attributeId, {
        value,
        colorHex: isColor ? (colorHex || undefined) : undefined,
        order: order ? Number(order) : 0,
        modifierType: modifierType || null,
        modifierValue: modifierType && modifierValue ? Number(modifierValue) : null,
      });
      setValue("");
      setColorHex("");
      setOrder("");
      setModifierType("");
      setModifierValue("");
      onAdded();
    } catch {
      toast.error("افزودن ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5 pt-2">
      {isColor && (
        <div className="flex items-center gap-1.5">
          <Label className="text-[11px] text-muted-foreground shrink-0">رنگ</Label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={colorHex || "#000000"}
              onChange={(e) => setColorHex(e.target.value)}
              className="size-8 shrink-0 cursor-pointer rounded-md border border-border bg-background p-0.5"
              title="انتخاب رنگ"
            />
            <Input
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              placeholder="#FF0000"
              className="h-8 w-24 text-xs nums-fa"
              dir="ltr"
            />
          </div>
          {colorHex && (
            <span
              className="size-6 rounded-full border border-border"
              style={{ backgroundColor: colorHex }}
              title={colorHex}
            />
          )}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isColor ? "نام رنگ (مثال: قرمز)" : "مقدار جدید..."}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <Input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          placeholder="ترتیب"
          className="h-8 w-16 text-xs nums-fa"
          dir="ltr"
          title="ترتیب نمایش"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <Button size="sm" className="h-8" onClick={onAdd} disabled={saving || !value.trim()}>
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Price modifier */}
      <div className="grid grid-cols-2 gap-1.5">
        <Select
          value={modifierType || "none"}
          onValueChange={(v) => setModifierType(v === "none" ? "" : (v as AttributeModifierType))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="تأثیر روی قیمت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون تأثیر</SelectItem>
            <SelectItem value="PERCENTAGE">درصد</SelectItem>
            <SelectItem value="FIXED_SOURCE_CURRENCY">مبلغ ثابت (ارز مبدأ)</SelectItem>
            <SelectItem value="FIXED_IRT">مبلغ ثابت (تومان)</SelectItem>
          </SelectContent>
        </Select>
        {modifierType ? (
          <Input
            type="number"
            value={modifierValue}
            onChange={(e) => setModifierValue(e.target.value)}
            placeholder={
              modifierType === "PERCENTAGE"
                ? "درصد (مثلاً 10-)"
                : modifierType === "FIXED_SOURCE_CURRENCY"
                ? "مقدار ارز"
                : "مقدار تومان"
            }
            className="h-8 text-xs nums-fa"
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
        ) : (
          <div />
        )}
      </div>
      {modifierType === "PERCENTAGE" && (
        <p className="text-[10px] text-muted-foreground">
          عدد مثبت = گران‌تر، عدد منفی = ارزان‌تر (بین ۱۰۰- تا ۱۰۰۰)
        </p>
      )}
      {modifierType === "FIXED_SOURCE_CURRENCY" && (
        <p className="text-[10px] text-muted-foreground">
          فقط روی محصولات ارزی (CURRENCY_BASED) اعمال می‌شود
        </p>
      )}
    </div>
  );
}

function AttributeFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [inputType, setInputType] = React.useState<AttributeInputType>("SELECT");
  const [isFilterable, setIsFilterable] = React.useState(true);
  const [isVariant, setIsVariant] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setInputType("SELECT");
      setIsFilterable(true);
      setIsVariant(false);
    }
  }, [open]);

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      await attributesService.create({ name, inputType, isFilterable, isVariant });
      toast.success("ویژگی ایجاد شد");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویژگی جدید</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام ویژگی *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: رنگ" />
          </div>
          <div className="space-y-2">
            <Label>نوع ورودی</Label>
            <Select value={inputType} onValueChange={(v) => setInputType(v as AttributeInputType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SELECT">انتخاب از لیست</SelectItem>
                <SelectItem value="COLOR">رنگ</SelectItem>
                <SelectItem value="TEXT">متن</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFilterable} onChange={(e) => setIsFilterable(e.target.checked)} className="size-4 rounded" />
              <span className="text-sm">قابل فیلتر در فروشگاه</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isVariant} onChange={(e) => setIsVariant(e.target.checked)} className="size-4 rounded" />
              <span className="text-sm">استفاده در تنوع محصول</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
