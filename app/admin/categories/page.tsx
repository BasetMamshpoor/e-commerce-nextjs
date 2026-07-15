"use client";

import * as React from "react";
import { Plus, FolderTree, ChevronLeft, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { EntityImageField, type EntityImageValue } from "@/components/common/entity-image-field";
import { categoriesService } from "@/services";
import type { Category } from "@/types/domain";
import { cn } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const [tree, setTree] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    categoriesService.tree().then(setTree).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت درخت دسته‌بندی محصولات</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          دسته جدید
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-16" />}
          title="دسته‌بندی‌ای موجود نیست"
          description="اولین دسته‌بندی را ایجاد کنید."
          className="border border-dashed border-border rounded-xl"
        />
      ) : (
        <div className="space-y-2">
          {tree.map((cat) => (
            <CategoryTreeItem
              key={cat.id}
              category={cat}
              depth={0}
              onEdit={(c) => {
                setEditing(c);
                setDialogOpen(true);
              }}
              onDeleted={load}
            />
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        allCategories={tree}
        onSaved={load}
      />
    </div>
  );
}

function CategoryTreeItem({
  category,
  depth,
  onEdit,
  onDeleted,
}: {
  category: Category;
  depth: number;
  onEdit: (c: Category) => void;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const handleDelete = async () => {
    if (!confirm(`حذف «${category.name}»؟`)) return;
    try {
      await categoriesService.delete(category.id);
      toast.success("دسته حذف شد");
      onDeleted();
    } catch {
      toast.error("حذف ناموفق بود — ممکن است زیردسته داشته باشد");
    }
  };

  return (
    <>
      <Card className="border-border/60" style={{ paddingRight: `${depth * 24 + 16}px` }}>
        <CardContent className="flex items-center gap-2 p-3">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronDown className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          ) : (
            <span className="w-7" />
          )}
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="size-full object-cover" />
            ) : (
              <FolderTree className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              /{category.slug}
            </p>
          </div>
          {!category.isActive && <Badge variant="secondary">غیرفعال</Badge>}
          {hasChildren && (
            <span className="text-xs text-muted-foreground nums-fa">
              {category.children!.length} زیردسته
            </span>
          )}
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(category)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </CardContent>
      </Card>
      {expanded && hasChildren && (
        <div className="space-y-2">
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  allCategories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  allCategories: Category[];
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<number | "">("");
  const [isActive, setIsActive] = React.useState(true);
  const [imageValue, setImageValue] = React.useState<EntityImageValue>({
    kind: "unchanged",
    previewUrl: null,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setSlug(category?.slug ?? "");
      setDescription(category?.description ?? "");
      setParentId(category?.parentId ?? "");
      setIsActive(category?.isActive ?? true);
      setImageValue({ kind: "unchanged", previewUrl: category?.imageUrl ?? null });
    }
  }, [open, category]);

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      const baseBody = {
        name,
        slug: slug || undefined,
        description: description || undefined,
        parentId: parentId === "" ? undefined : Number(parentId),
        isActive,
      };

      // Route based on image value (file → multipart, mediaId → JSON, removed → null).
      const hasFile = imageValue.kind === "file";
      const imageFile = hasFile ? (imageValue as { file: File }).file : undefined;
      const imageJsonFields =
        imageValue.kind === "mediaId"
          ? { imageMediaId: (imageValue as { mediaId: number }).mediaId }
          : imageValue.kind === "removed" && category
          ? { imageMediaId: null }
          : {};

      const fullBody = { ...baseBody, ...imageJsonFields };

      if (category) {
        if (imageFile) {
          await categoriesService.updateWithImage(category.id, fullBody, imageFile);
        } else {
          await categoriesService.update(category.id, fullBody);
        }
        toast.success("دسته به‌روزرسانی شد");
      } else {
        if (imageFile) {
          await categoriesService.createWithImage(fullBody, imageFile);
        } else {
          await categoriesService.create(fullBody);
        }
        toast.success("دسته ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  // Flatten categories for parent select.
  const flatCats = React.useMemo(() => {
    const result: Category[] = [];
    const walk = (cats: Category[]) => {
      for (const c of cats) {
        result.push(c);
        if (c.children) walk(c.children);
      }
    };
    walk(allCategories);
    return result.filter((c) => c.id !== category?.id);
  }, [allCategories, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "ویرایش دسته" : "دسته جدید"}</DialogTitle>
          <DialogDescription>اطلاعات دسته‌بندی را وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <EntityImageField
            label="تصویر دسته"
            initialUrl={category?.imageUrl}
            onChange={setImageValue}
            disabled={saving}
            square
          />

          <div className="space-y-2">
            <Label>نام *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: موبایل" />
          </div>
          <div className="space-y-2">
            <Label>اسلاگ (اختیاری)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mobile"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">اگر خالی بگذارید، خودکار ساخته می‌شود.</p>
          </div>
          <div className="space-y-2">
            <Label>دسته والد</Label>
            <Select value={parentId === "" ? "" : String(parentId)} onValueChange={(v) => setParentId(v ? Number(v) : "")}>
              <SelectTrigger>
                <SelectValue placeholder="بدون والد (دسته اصلی)" />
              </SelectTrigger>
              <SelectContent>
                {flatCats.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded"
            />
            <span className="text-sm">فعال</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
