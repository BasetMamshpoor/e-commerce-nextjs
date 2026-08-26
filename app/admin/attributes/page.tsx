"use client";

import * as React from "react";
import { Plus, Settings, Trash2, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryTreeSelect } from "@/components/common/category-tree-select";
import { categoriesService } from "@/services";
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
import type { Attribute, AttributeInputType, Category } from "@/types/domain";

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAttr, setEditingAttr] = React.useState<Attribute | null>(null);

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
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف ناموفق — در تنوع محصول استفاده شده");
    }
  };

  const handleDeleteValue = async (attrId: number, valueId: number) => {
    try {
      await attributesService.deleteValue(valueId);
      toast.success("مقدار حذف شد");
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف ناموفق — این مقدار در تنوع محصولی استفاده شده است");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">ویژگی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت ویژگی‌های محصولات (رنگ، سایز، جنس و...)</p>
        </div>
        <Button onClick={() => { setEditingAttr(null); setDialogOpen(true); }}>
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
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditingAttr(attr); setDialogOpen(true); }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(attr.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{attr.inputType}</Badge>
                  {attr.isFilterable && <Badge variant="secondary" className="text-xs">قابل فیلتر</Badge>}
                  {attr.isVariant && <Badge className="text-xs">تنوع</Badge>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {attr.values.map((v) => (
                    <ValueBadge
                      key={v.id}
                      value={v}
                      isColor={attr.inputType === "COLOR"}
                      onSaved={load}
                      onDelete={() => handleDeleteValue(attr.id, v.id)}
                    />
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
        attribute={editingAttr}
        onSaved={load}
      />
    </div>
  );
}

function ValueBadge({
  value,
  isColor,
  onSaved,
  onDelete,
}: {
  value: Attribute["values"][number];
  isColor: boolean;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(value.value);
  const [colorHex, setColorHex] = React.useState(value.colorHex ?? "#000000");
  const [order, setOrder] = React.useState(String(value.order ?? 0));
  const [saving, setSaving] = React.useState(false);

  const startEdit = () => {
    setText(value.value);
    setColorHex(value.colorHex ?? "#000000");
    setOrder(String(value.order ?? 0));
    setEditing(true);
  };

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await attributesService.updateValue(value.id, {
        value: text.trim(),
        colorHex: isColor ? colorHex : undefined,
        order: order ? Number(order) : 0,
      });
      setEditing(false);
      onSaved();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-background px-1.5 py-0.5">
        {isColor && (
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="size-5 shrink-0 cursor-pointer rounded border border-border p-0"
          />
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="h-6 w-20 rounded border border-border bg-background px-1 text-xs"
          autoFocus
        />
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          title="ترتیب"
          className="h-6 w-10 rounded border border-border bg-background px-1 text-[10px] nums-fa"
          dir="ltr"
        />
        <button onClick={save} disabled={saving} className="text-primary hover:text-primary/80">
          <Check className="size-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
      title={value.order ? `ترتیب: ${value.order}` : undefined}
    >
      {isColor && value.colorHex && (
        <span
          className="size-2.5 rounded-full border border-border"
          style={{ backgroundColor: value.colorHex }}
        />
      )}
      <button onClick={startEdit} className="hover:underline">
        {value.value}
      </button>
      {value.order ? (
        <span className="text-[10px] text-muted-foreground nums-fa">
          ({value.order})
        </span>
      ) : null}
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
        <X className="size-3" />
      </button>
    </span>
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
  const [saving, setSaving] = React.useState(false);

  const isColor = inputType === "COLOR";

  const onAdd = async () => {
    if (!value.trim()) return;
    if (isColor && !colorHex.trim()) {
      toast.error("برای ویژگی رنگ، کد رنگ الزامی است");
      return;
    }
    setSaving(true);
    try {
      await attributesService.addValue(attributeId, {
        value,
        colorHex: isColor ? (colorHex || undefined) : undefined,
        order: order ? Number(order) : 0,
      });
      setValue("");
      setColorHex("");
      setOrder("");
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
      <p className="text-[10px] text-muted-foreground">
        modifiers قیمت روی هر variant محصول تنظیم می‌شود، نه روی مقدار ویژگی.
      </p>
    </div>
  );
}

function AttributeFormDialog({
  open,
  onOpenChange,
  attribute,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute: Attribute | null;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [inputType, setInputType] = React.useState<AttributeInputType>("SELECT");
  const [isFilterable, setIsFilterable] = React.useState(true);
  const [isVariant, setIsVariant] = React.useState(false);
  const [categoryIds, setCategoryIds] = React.useState<number[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(attribute?.name ?? "");
      setInputType(attribute?.inputType ?? "SELECT");
      setIsFilterable(attribute?.isFilterable ?? true);
      setIsVariant(attribute?.isVariant ?? false);
      setCategoryIds(attribute?.categories?.map((c) => c.categoryId) ?? []);
      categoriesService.tree().then(setCategoryTree).catch(() => {});
    }
  }, [open, attribute]);

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      if (attribute) {
        await attributesService.update(attribute.id, { name, inputType, isFilterable, isVariant, categoryIds });
        toast.success("ویژگی به‌روزرسانی شد");
      } else {
        await attributesService.create({ name, inputType, isFilterable, isVariant, categoryIds });
        toast.success("ویژگی ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{attribute ? "ویرایش ویژگی" : "ویژگی جدید"}</DialogTitle>
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
          <div className="space-y-2">
            <Label>
              دسته‌بندی‌های قابل استفاده
              <span className="mr-1 text-xs text-muted-foreground">
                (خالی = همه‌ی دسته‌بندی‌ها)
              </span>
            </Label>
            <p className="text-xs text-muted-foreground">
              اگر دسته‌بندی خاصی انتخاب نکنید، این ویژگی برای همه‌ی محصولات در دسترس خواهد بود. با انتخاب
              دسته‌بندی، فقط موقع ثبت/ویرایش محصولی که در همان دسته‌بندی(ها) باشد پیشنهاد می‌شود.
            </p>
            <CategoryTreeSelect categories={categoryTree} selectedIds={categoryIds} onChange={setCategoryIds} />
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
