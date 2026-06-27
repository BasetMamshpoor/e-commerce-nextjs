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
import type { Attribute, AttributeInputType } from "@/types/domain";

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

  const handleDelete = async (id: string) => {
    if (!confirm("حذف این ویژگی؟")) return;
    try {
      await attributesService.delete(id);
      toast.success("ویژگی حذف شد");
      load();
    } catch {
      toast.error("حذف ناموفق — در تنوع محصول استفاده شده");
    }
  };

  const handleDeleteValue = async (attrId: string, valueId: string) => {
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
                    >
                      {attr.inputType === "COLOR" && v.colorHex && (
                        <span
                          className="size-2.5 rounded-full border border-border"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      {v.value}
                      <button
                        onClick={() => handleDeleteValue(attr.id, v.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <AddValueForm attributeId={attr.id} onAdded={load} />
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

function AddValueForm({ attributeId, onAdded }: { attributeId: string; onAdded: () => void }) {
  const [value, setValue] = React.useState("");
  const [colorHex, setColorHex] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const onAdd = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await attributesService.addValue(attributeId, {
        value,
        colorHex: colorHex || undefined,
      });
      setValue("");
      setColorHex("");
      onAdded();
    } catch {
      toast.error("افزودن ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-1.5 pt-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="مقدار جدید..."
        className="h-8 text-sm"
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
      />
      <Button size="sm" className="h-8" onClick={onAdd} disabled={saving || !value.trim()}>
        <Plus className="size-3.5" />
      </Button>
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
