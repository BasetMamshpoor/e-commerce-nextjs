"use client";

import * as React from "react";
import { Check, X, MessageSquare, Eye, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { commentsService } from "@/services";
import type { CommentStatus, PaginatedData, Comment } from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<CommentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار", variant: "secondary" },
  APPROVED: { label: "تأیید شده", variant: "default" },
  REJECTED: { label: "رد شده", variant: "destructive" },
};

/** Get author name from user.fullName (fallback to authorName). */
function getAuthorName(c: Comment): string {
  return c.user?.fullName ?? c.authorName ?? "ناشناس";
}

/** Get entity name (product/blog post title). */
function getEntityName(c: Comment): string {
  return c.entity?.name ?? "—";
}

export default function AdminCommentsPage() {
  const [data, setData] = React.useState<PaginatedData<Comment> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  // Tab: ALL / PENDING / REVIEWED
  const [tab, setTab] = React.useState<"ALL" | "PENDING" | "REVIEWED">("ALL");

  // Filters
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [productSearch, setProductSearch] = React.useState("");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (tab === "PENDING") {
      params.isReviewed = false;
    } else if (tab === "REVIEWED") {
      params.isReviewed = true;
    }
    if (typeFilter !== "ALL") params.commentableType = typeFilter;
    if (productSearch.trim()) params.productSearch = productSearch.trim();
    if (search.trim()) params.search = search.trim();
    commentsService
      .adminList(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, tab, typeFilter, productSearch, search]);

  React.useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    try {
      await commentsService.adminUpdate(id, { status: "APPROVED" });
      toast.success("نظر تأیید شد");
      load();
    } catch { toast.error("عملیات ناموفق بود"); }
  };

  const handleReject = async (id: number) => {
    try {
      await commentsService.adminUpdate(id, { status: "REJECTED" });
      toast.success("نظر رد شد");
      load();
    } catch { toast.error("عملیات ناموفق بود"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این نظر؟")) return;
    try {
      await commentsService.delete(id);
      toast.success("نظر حذف شد");
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف ناموفق بود");
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <MessageSquare className="size-5 text-primary" />
          نظرات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت و تأیید نظرات کاربران (محصولات و وبلاگ)</p>
      </div>

      {/* Tabs for review status */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {([
          { key: "ALL", label: "همه" },
          { key: "PENDING", label: "بررسی‌نشده" },
          { key: "REVIEWED", label: "بررسی شده" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">نوع نظر</label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه</SelectItem>
                <SelectItem value="PRODUCT">محصول</SelectItem>
                <SelectItem value="BLOG_POST">وبلاگ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">جستجوی محصول</label>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="نام محصول..."
              className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">جستجوی متن نظر</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="متن نظر..."
              className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comment list — flat (admin returns flat list, not tree) */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-12" />}
          title="نظری یافت نشد"
          description="با فیلترهای انتخاب‌شده نظری موجود نیست."
          className="py-12"
        />
      ) : (
        <div className="space-y-2">
          {items.map((comment) => {
            const cfg = STATUS_CONFIG[comment.status ?? "PENDING"];
            return (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Author + meta */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{getAuthorName(comment)}</span>
                        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                        {comment.rating && (
                          <span className="text-xs text-amber-500 nums-fa">★ {toPersianDigits(comment.rating)}</span>
                        )}
                        {comment.commentableType && (
                          <Badge variant="outline" className="text-[10px]">
                            {comment.commentableType === "PRODUCT" ? "محصول" : "وبلاگ"}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{formatDateTimeFa(comment.createdAt)}</span>
                      </div>
                      {/* Entity (product/blog name) */}
                      {comment.entity && (
                        <p className="mt-0.5 text-xs text-primary">
                          {comment.commentableType === "PRODUCT" ? "محصول: " : "مقاله: "}
                          {getEntityName(comment)}
                        </p>
                      )}
                      {/* Content */}
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
                      {/* Media/attachments */}
                      {(comment.media ?? comment.attachments) && (comment.media ?? comment.attachments)!.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(comment.media ?? comment.attachments)!.map((m) => (
                            <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md">
                              {m.mimeType?.startsWith("image/") ? (
                                 
                                <img src={m.url} alt={m.originalName} className="size-16 object-cover" />
                              ) : (
                                <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-primary">{m.originalName}</span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex shrink-0 gap-1">
                      {comment.status !== "APPROVED" && (
                        <Button variant="ghost" size="icon" className="size-8 text-success" onClick={() => handleApprove(comment.id)} title="تأیید">
                          <Check className="size-4" />
                        </Button>
                      )}
                      {comment.status !== "REJECTED" && (
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleReject(comment.id)} title="رد">
                          <X className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(comment.id)} title="حذف">
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground nums-fa">مجموع: {toPersianDigits(data?.meta?.total ?? 0)} مورد</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4 rotate-180" />
            </Button>
            <span className="text-sm nums-fa">صفحه {toPersianDigits(page)} از {toPersianDigits(data?.meta?.totalPages ?? 1)}</span>
            <Button variant="outline" size="icon" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
