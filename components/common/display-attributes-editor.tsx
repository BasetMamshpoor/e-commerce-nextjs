"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Attribute } from "@/types/domain";

export interface DisplayAttributeFormData {
  attributeId: number | "";
  value: string;
}

interface DisplayAttributesEditorProps {
  attributes: DisplayAttributeFormData[];
  onChange: (attrs: DisplayAttributeFormData[]) => void;
  /** Available attributes (only display-type will be shown). */
  availableAttributes: Attribute[];
}

/**
 * Editor for product display attributes (isDisplay=true).
 * These are shown on the product detail page in the specs tab.
 */
export function DisplayAttributesEditor({
  attributes,
  onChange,
  availableAttributes,
}: DisplayAttributesEditorProps) {
  // Only show attributes marked as display
  const displayAttributes = availableAttributes.filter((a) => a.isDisplay);

  if (displayAttributes.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
        هنوز ویژگی نمایشی (isDisplay) تعریف نشده. از بخش ویژگی‌ها ایجاد کنید.
      </p>
    );
  }

  const add = () => {
    onChange([...attributes, { attributeId: "", value: "" }]);
  };

  const remove = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const update = (index: number, updates: Partial<DisplayAttributeFormData>) => {
    onChange(attributes.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  return (
    <div className="space-y-2">
      {attributes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          هیچ ویژگی نمایشی اضافه نشده. روی «افزودن» بزنید.
        </p>
      )}
      {attributes.map((attr, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select
            value={String(attr.attributeId)}
            onValueChange={(v) => update(index, { attributeId: v ? Number(v) : "" })}
          >
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue placeholder="انتخاب ویژگی" />
            </SelectTrigger>
            <SelectContent>
              {displayAttributes.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={attr.value}
            onChange={(e) => update(index, { value: e.target.value })}
            placeholder="مقدار ویژگی..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="w-full"
      >
        <Plus className="size-4" />
        افزودن ویژگی نمایشی
      </Button>
    </div>
  );
}
