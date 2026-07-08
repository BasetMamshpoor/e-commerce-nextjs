"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { blogService } from "@/services";
import type { BlogCategory, BlogPost, BlogPostStatus } from "@/types/domain";

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "PUBLISHED", label: "منتشر شده" },
  { value: "ARCHIVED", label: "آرشیو" },
];

interface BlogFormProps {
  /** Existing post for edit mode. null for create mode. */
  post?: BlogPost | null;
  /** Loading state (fetching post data). */
  loading?: boolean;
}

/**
 * Full blog post form — used for both create and edit.
 * Fields: title, slug, excerpt, content (TipTap), coverImage (file upload),
 * categoryId, status, metaTitle, metaDescription, productIds.
 */
export function BlogForm({ post, loading: externalLoading }: BlogFormProps) {
  const router = useRouter();
  const [categories, setCategories] = React.useState<BlogCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<number | "">("");
  const [status, setStatus] = React.useState<BlogPostStatus>("DRAFT");
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDescription, setMetaDescription] = React.useState("");
  const [productIdsStr, setProductIdsStr] = React.useState("");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load categories + initialize from post
  React.useEffect(() => {
    blogService
      .categories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt ?? "");
      setContent(post.content ?? "");
      setCategoryId(post.categoryId ?? "");
      setStatus(post.status);
      setMetaTitle(post.metaTitle ?? "");
      setMetaDescription(post.metaDescription ?? "");
      setCoverImagePreview(post.coverImageUrl ?? null);
    }
  }, [post]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }

    setSaving(true);
    try {
      const productIds = productIdsStr
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const body = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content: content || undefined,
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        status,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        productIds: productIds.length > 0 ? productIds : undefined,
      };

      if (post) {
        // Edit mode
        if (coverImage) {
          // Multipart with cover image
          await blogService.updateWithCover(post.id, body, coverImage);
        } else {
          await blogService.update(post.id, body);
        }
        toast.success("مقاله به‌روزرسانی شد");
        router.push("/admin/blog");
      } else {
        // Create mode
        if (coverImage) {
          await blogService.createWithCover(body, coverImage);
        } else {
          await blogService.create(body);
        }
        toast.success("مقاله ایجاد شد");
        router.push("/admin/blog");
      }
      router.refresh();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading || externalLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <button onClick={() => router.back()}>
            <ArrowRight className="size-5" />
          </button>
        </Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {post ? "ویرایش مقاله" : "مقاله جدید"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات اصلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان مقاله"
                />
              </div>
              <div className="space-y-2">
                <Label>نامک (slug) — اختیاری</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="خودکار از عنوان"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>خلاصه</Label>
                <Input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="خلاصه کوتاه مقاله"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content (TipTap) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">محتوای مقاله</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="محتوای کامل مقاله را بنویسید..."
              />
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تصویر کاور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileSelected}
                className="hidden"
              />
              {coverImagePreview ? (
                <div className="relative overflow-hidden rounded-xl">
                  { }
                  <img
                    src={coverImagePreview}
                    alt="cover preview"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute left-2 top-2 size-8"
                    onClick={removeCoverImage}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <Upload className="mb-2 size-8" />
                  <span className="text-sm font-medium">تصویر کاور را آپلود کنید</span>
                  <span className="mt-1 text-xs">فرمت: JPG, PNG, WebP</span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تنظیمات انتشار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>محصولات مرتبط (IDs)</Label>
                <Input
                  value={productIdsStr}
                  onChange={(e) => setProductIdsStr(e.target.value)}
                  placeholder="مثال: 1, 5, 12"
                  dir="ltr"
                  className="text-left text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  شناسه محصولات مرتبط را با کاما جدا کنید.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">سئو</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان متا</Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="عنوان برای موتورهای جستجو"
                />
              </div>
              <div className="space-y-2">
                <Label>توضیحات متا</Label>
                <Input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="توضیحات متا"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "در حال ذخیره..." : post ? "ذخیره تغییرات" : "ایجاد مقاله"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={saving}
            >
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
