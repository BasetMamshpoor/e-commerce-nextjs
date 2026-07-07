"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [deleteTarget, setDeleteTarget] = React.useState<BlogPost | null>(null);

  // Categories
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [catDialogOpen, setCatDialogOpen] = React.useState(false);
  const [editingCat, setEditingCat] = React.useState<BlogCategory | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catSlug, setCatSlug] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");
  const [catSaving, setCatSaving] = React.useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = React.useState<BlogCategory | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    const params: { page: number; limit: number; status?: string } = { page, limit: 20 };
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

  const loadCategories = React.useCallback(() => {
    blogService.categories().then(setCategories).catch(() => {});
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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

  // Category CRUD
  const openCreateCat = () => {
    setEditingCat(null);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    setCatDialogOpen(true);
  };

  const openEditCat = (cat: BlogCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description ?? "");
    setCatDialogOpen(true);
  };

  const onSaveCat = async () => {
    if (!catName.trim()) {
      toast.error("نام دسته الزامی است");
      return;
    }
    setCatSaving(true);
    try {
      const body = {
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDesc.trim() || undefined,
      };
      if (editingCat) {
        await blogService.updateCategory(editingCat.id, body);
        toast.success("دسته‌بندی ویرایش شد");
      } else {
        await blogService.createCategory(body);
        toast.success("دسته‌بندی ایجاد شد");
      }
      setCatDialogOpen(false);
      loadCategories();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setCatSaving(false);
    }
  };

  const onDeleteCat = async (cat: BlogCategory) => {
    try {
      await blogService.deleteCategory(cat.id);
      toast.success("دسته‌بندی حذف شد");
      setDeleteCatTarget(null);
      loadCategories();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف ناموفق بود");
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
          <Button variant="outline" onClick={openCreateCat}>
            <Plus className="size-4" />
            دسته جدید
          </Button>
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="size-4" />
              مقاله جدید
            </Link>
          </Button>
        </div>
      </div>

      {/* Blog categories with edit/delete */}
      {categories.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">دسته‌بندی‌ها:</span>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                <span className="text-xs font-medium">{c.name}</span>
                <button
                  onClick={() => openEditCat(c)}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="ویرایش"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={() => setDeleteCatTarget(c)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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
                {p.excerpt && <p className="line-clamp-1 text-xs text-muted-foreground">{p.excerpt}</p>}
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
                <Button asChild size="icon" variant="ghost" className="size-8" aria-label="مشاهده">
                  <Link href={`/blog/${p.slug}`}><Eye className="size-4" /></Link>
                </Button>
                <Button asChild size="icon" variant="ghost" className="size-8" aria-label="ویرایش">
                  <Link href={`/admin/blog/${p.id}/edit`}><Pencil className="size-4" /></Link>
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

      {/* Delete post dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteTarget?.title}» مطمئن هستید؟
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

      {/* Delete category dialog */}
      <AlertDialog open={!!deleteCatTarget} onOpenChange={(open) => !open && setDeleteCatTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteCatTarget?.name}» مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCatTarget && onDeleteCat(deleteCatTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category create/edit dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "ویرایش دسته‌بندی" : "دسته‌بندی وبلاگ جدید"}</DialogTitle>
            <DialogDescription>دسته‌بندی‌ها برای گروه‌بندی مقالات استفاده می‌شوند.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نام دسته *</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="مثال: راهنمای خرید" />
            </div>
            <div className="space-y-2">
              <Label>نامک (slug) — اختیاری</Label>
              <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="خودکار از نام" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>توضیحات — اختیاری</Label>
              <Input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="توضیح کوتاه دسته" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>انصراف</Button>
            <Button onClick={onSaveCat} disabled={catSaving || !catName.trim()}>
              {catSaving && <Loader2 className="size-4 animate-spin" />}
              {catSaving ? "در حال ذخیره..." : editingCat ? "ذخیره تغییرات" : "ایجاد دسته"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
