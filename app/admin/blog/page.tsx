"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminTable } from "@/features/admin/components/admin-table";
import { blogService } from "@/services";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import type { BlogPost, BlogCategory, BlogPostStatus, PaginatedData } from "@/types/domain";

const STATUS_LABELS: Record<BlogPostStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "پیش‌نویس", variant: "secondary" },
  PUBLISHED: { label: "منتشر شده", variant: "default" },
  ARCHIVED: { label: "آرشیو", variant: "outline" },
};

export default function AdminBlogPage() {
  const [data, setData] = React.useState<PaginatedData<BlogPost> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BlogPost | null>(null);

  // Categories
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [catDialogOpen, setCatDialogOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatSlug, setNewCatSlug] = React.useState("");
  const [newCatDesc, setNewCatDesc] = React.useState("");
  const [catSaving, setCatSaving] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    const params: { page: number; limit: number; status?: string; search?: string } = {
      page,
      limit: 20,
    };
    if (statusFilter !== "ALL") params.status = statusFilter;
    blogService
      .adminList(params)
      .then(setData)
      .catch(() => toast.error("بارگذاری مقالات ناموفق بود"))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    blogService.categories().then(setCategories).catch(() => {});
  }, []);

  const items = data?.items ?? [];
  const filtered = search.trim()
    ? items.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const onDelete = async (post: BlogPost) => {
    try {
      await blogService.delete(post.id);
      toast.success("مقاله حذف شد");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("حذف ناموفق بود");
    }
  };

  const onCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("نام دسته الزامی است");
      return;
    }
    setCatSaving(true);
    try {
      await blogService.createCategory({
        name: newCatName.trim(),
        slug: newCatSlug.trim() || undefined,
        description: newCatDesc.trim() || undefined,
      });
      toast.success("دسته‌بندی ایجاد شد");
      setCatDialogOpen(false);
      setNewCatName("");
      setNewCatSlug("");
      setNewCatDesc("");
      // Reload categories
      blogService.categories().then(setCategories).catch(() => {});
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ایجاد دسته ناموفق بود");
    } finally {
      setCatSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <FileText className="size-5 text-primary" />
            وبلاگ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت مقالات و دسته‌بندی‌های وبلاگ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCatDialogOpen(true)}
          >
            <Plus className="size-4" />
            دسته جدید
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            مقاله جدید
          </Button>
        </div>
      </div>

      {/* Blog categories display */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-xs font-medium text-muted-foreground">دسته‌بندی‌ها:</span>
          {categories.map((c) => (
            <Badge key={c.id} variant="outline" className="text-xs">
              {c.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
              <SelectItem value="DRAFT">پیش‌نویس</SelectItem>
              <SelectItem value="PUBLISHED">منتشر شده</SelectItem>
              <SelectItem value="ARCHIVED">آرشیو</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AdminTable
        title=""
        columns={[
          {
            key: "title",
            header: "عنوان",
            render: (p) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.title}</p>
                {p.excerpt && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {p.excerpt}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (p) => {
              const cfg = STATUS_LABELS[p.status] ?? STATUS_LABELS.DRAFT;
              return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
            },
          },
          {
            key: "publishedAt",
            header: "تاریخ انتشار",
            hideOnMobile: true,
            render: (p) => (
              <span className="text-xs text-muted-foreground">
                {p.publishedAt ? formatDateTimeFa(p.publishedAt) : "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "عملیات",
            align: "left",
            render: (p) => (
              <div className="flex gap-1">
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="مشاهده"
                >
                  <Link href={`/blog/${p.slug}`}>
                    <Eye className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => {
                    setEditing(p);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(p)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={filtered}
        isLoading={loading}
        getRowId={(p) => String(p.id)}
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        total={data?.meta?.total ?? 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="جستجو در مقالات..."
        emptyTitle="مقاله‌ای یافت نشد"
      />

      <BlogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
        onSuccess={load}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteTarget?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && onDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blog category create dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دسته‌بندی وبلاگ جدید</DialogTitle>
            <DialogDescription>
              دسته‌بندی‌ها برای گروه‌بندی مقالات استفاده می‌شوند.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نام دسته *</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="مثال: راهنمای خرید"
              />
            </div>
            <div className="space-y-2">
              <Label>نامک (slug) — اختیاری</Label>
              <Input
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                placeholder="خودکار از نام"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات — اختیاری</Label>
              <Input
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="توضیح کوتاه دسته"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={onCreateCategory} disabled={catSaving || !newCatName.trim()}>
              {catSaving && <Loader2 className="size-4 animate-spin" />}
              {catSaving ? "در حال ذخیره..." : "ایجاد دسته"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────── Blog create/edit dialog ───────── */
function BlogDialog({
  open,
  onOpenChange,
  editing,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BlogPost | null;
  categories: BlogCategory[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<number | "">("");
  const [status, setStatus] = React.useState<BlogPostStatus>("DRAFT");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setSlug(editing?.slug ?? "");
      setExcerpt(editing?.excerpt ?? "");
      setContent(editing?.content ?? "");
      setCategoryId(editing?.categoryId ?? "");
      setStatus(editing?.status ?? "DRAFT");
    }
  }, [open, editing]);

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body: Partial<BlogPost> = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content: content || undefined,
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        status,
      };
      if (editing) {
        await blogService.update(editing.id, body);
        toast.success("مقاله به‌روزرسانی شد");
      } else {
        await blogService.create(body);
        toast.success("مقاله ایجاد شد");
      }
      onOpenChange(false);
      onSuccess();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "ویرایش مقاله" : "مقاله جدید"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "ویرایش محتوای مقاله"
              : "ایجاد مقاله جدید — پس از انتشار در وبلاگ نمایش داده می‌شود."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان مقاله"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نامک (slug)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="خودکار از عنوان"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>دسته‌بندی</Label>
              <Select
                value={categoryId === "" ? "" : String(categoryId)}
                onValueChange={(v) => setCategoryId(v ? Number(v) : "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as BlogPostStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">پیش‌نویس</SelectItem>
                <SelectItem value="PUBLISHED">منتشر شده</SelectItem>
                <SelectItem value="ARCHIVED">آرشیو</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>خلاصه</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="خلاصه کوتاه مقاله"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>محتوا (HTML)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>محتوای مقاله</p>"
              rows={8}
              dir="ltr"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              محتوای HTML مجاز است (h2, p, ul, li, img, ...)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={onSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد مقاله"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
