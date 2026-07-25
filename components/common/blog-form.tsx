"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Upload, X, Plus, Search, FolderOpen, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { MediaGalleryPicker } from "@/components/common/media-gallery-picker";
import { blogService, productsService } from "@/services";
import type { BlogCategory, BlogPost, BlogPostStatus, Product } from "@/types/domain";

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "PUBLISHED", label: "منتشر شده" },
  { value: "ARCHIVED", label: "آرشیو" },
];

interface BlogFormProps {
  post?: BlogPost | null;
  loading?: boolean;
}

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
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverImageMediaId, setCoverImageMediaId] = React.useState<number | null>(null);
  const [coverImagePreview, setCoverImagePreview] = React.useState<string | null>(null);
  const [coverImageRemoved, setCoverImageRemoved] = React.useState(false);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Related products selector
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    blogService.categories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
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
      setTags(post.tags ?? []);
      setCoverImage(null);
      setCoverImageMediaId(null);
      setCoverImagePreview(post.coverImageUrl ?? null);
      setCoverImageRemoved(false);
      // Pre-load related products
      if (post.productIds && post.productIds.length > 0) {
        productsService.adminList({ page: 1, limit: 100 }).then((data) => {
          const related = data.items.filter((p) => post.productIds!.includes(p.id));
          setSelectedProducts(related);
        }).catch(() => {});
      }
    }
  }, [post]);

  // Product search
  React.useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      productsService.list({ search: productSearch, page: 1, limit: 10 })
        .then((data) => setSearchResults(data.items))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverImageMediaId(null);
    setCoverImagePreview(URL.createObjectURL(file));
    setCoverImageRemoved(false);
  };

  const onGallerySelect = (items: Array<{ id: number; url: string }>) => {
    if (items.length === 0) return;
    const picked = items[0];
    setCoverImage(null);
    setCoverImageMediaId(picked.id);
    setCoverImagePreview(picked.url);
    setCoverImageRemoved(false);
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImageMediaId(null);
    setCoverImagePreview(null);
    setCoverImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const addProduct = (p: Product) => {
    if (!selectedProducts.some((x) => x.id === p.id)) {
      setSelectedProducts([...selectedProducts, p]);
    }
    setProductSearch("");
    setSearchResults([]);
  };

  const removeProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content: content || undefined,
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        status,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        productIds: selectedProducts.length > 0 ? selectedProducts.map((p) => p.id) : undefined,
        // Attach coverImageMediaId when picking from gallery OR removing existing.
        ...(coverImageMediaId ? { coverImageMediaId: coverImageMediaId } : {}),
        ...(coverImageRemoved && !coverImage && post ? {} : {}),
      };

      if (post) {
        if (coverImage) {
          await blogService.updateWithCover(post.id, body, coverImage);
        } else {
          await blogService.update(post.id, body);
        }
        toast.success("مقاله به‌روزرسانی شد");
      } else {
        if (coverImage) {
          await blogService.createWithCover(body, coverImage);
        } else {
          await blogService.create(body);
        }
        toast.success("مقاله ایجاد شد");
      }
      router.push("/admin/blog");
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
          <button onClick={() => router.back()}><ArrowRight className="size-5" /></button>
        </Button>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {post ? "ویرایش مقاله" : "مقاله جدید"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle className="text-base">اطلاعات اصلی</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان مقاله" />
              </div>
              <div className="space-y-2">
                <Label>نامک (slug) — اختیاری</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="خودکار از عنوان" dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <Label>خلاصه</Label>
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="خلاصه کوتاه مقاله" />
              </div>
              {/* Tags */}
              <div className="space-y-2">
                <Label>کلمات کلیدی (تگ‌ها)</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="کلمه کلیدی را وارد کنید و Enter بزنید"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button onClick={() => removeTag(t)} className="hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader><CardTitle className="text-base">محتوای مقاله</CardTitle></CardHeader>
            <CardContent>
              <RichTextEditor value={content} onChange={setContent} placeholder="محتوای کامل مقاله را بنویسید..." />
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader><CardTitle className="text-base">تصویر کاور</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
              {coverImagePreview ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img src={coverImagePreview} alt="cover" className="aspect-[16/9] w-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute left-2 top-2 size-8" onClick={removeCoverImage} disabled={saving}>
                    <X className="size-4" />
                  </Button>
                  {!coverImage && !coverImageMediaId && (
                    <p className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white">تصویر فعلی</p>
                  )}
                  {coverImageMediaId && (
                    <p className="absolute bottom-2 right-2 rounded-md bg-primary/80 px-2 py-1 text-[10px] text-primary-foreground">از گالری</p>
                  )}
                  {coverImage && (
                    <p className="absolute bottom-2 right-2 rounded-md bg-success/80 px-2 py-1 text-[10px] text-white">آپلود جدید</p>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
                  <ImageIcon className="mb-2 size-8" />
                  <span className="text-sm">تصویری انتخاب نشده</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  <Upload className="size-4" />
                  آپلود از حافظه
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setGalleryOpen(true)} disabled={saving}>
                  <FolderOpen className="size-4" />
                  انتخاب از گالری
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">فرمت: JPG, PNG, WebP — پیشنهاد: ۱۲۰۰×۶۷۵ پیکسل</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تنظیمات انتشار</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={categoryId === "" ? "" : String(categoryId)} onValueChange={(v) => setCategoryId(v ? Number(v) : "")}>
                  <SelectTrigger><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Related products */}
          <Card>
            <CardHeader><CardTitle className="text-base">محصولات مرتبط</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="pr-9"
                />
                {searching && <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />}
              </div>
              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-right text-xs hover:bg-accent"
                    >
                      <Plus className="size-3 shrink-0 text-primary" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Selected products */}
              {selectedProducts.length > 0 && (
                <div className="space-y-1">
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                      <span className="truncate">{p.name}</span>
                      <button onClick={() => removeProduct(p.id)} className="text-destructive hover:text-destructive/80">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle className="text-base">سئو</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان متا</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="عنوان برای موتورهای جستجو" />
              </div>
              <div className="space-y-2">
                <Label>توضیحات متا</Label>
                <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="توضیحات متا" />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "در حال ذخیره..." : post ? "ذخیره تغییرات" : "ایجاد مقاله"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.back()} disabled={saving}>انصراف</Button>
          </div>
        </div>
      </div>

      <MediaGalleryPicker
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={onGallerySelect}
        multiple={false}
        allowedType="IMAGE"
        title="انتخاب تصویر کاور"
      />
    </div>
  );
}
