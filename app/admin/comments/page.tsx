"use client";

import * as React from "react";
import { Check, X, MessageSquare, Eye, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
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

export default function AdminCommentsPage() {
  const [data, setData] = React.useState<PaginatedData<Comment> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  // Filters per api.md
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [reviewedFilter, setReviewedFilter] = React.useState<string>("ALL");
  const [productSearch, setProductSearch] = React.useState("");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (typeFilter !== "ALL") params.commentableType = typeFilter;
    if (reviewedFilter !== "ALL") params.isReviewed = reviewedFilter === "reviewed";
    if (productSearch.trim()) params.productSearch = productSearch.trim();
    if (search.trim()) params.search = search.trim();
    commentsService
      .adminList(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter, reviewedFilter, productSearch, search]);

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

      {/* Filters — at TOP per api.md */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">وضعیت</label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه</SelectItem>
                <SelectItem value="PENDING">در انتظار</SelectItem>
                <SelectItem value="APPROVED">تأیید شده</SelectItem>
                <SelectItem value="REJECTED">رد شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">نوع</label>
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
            <label className="mb-1 block text-xs text-muted-foreground">بررسی شده</label>
            <Select value={reviewedFilter} onValueChange={(v) => { setReviewedFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه</SelectItem>
                <SelectItem value="pending">فقط بررسی‌نشده</SelectItem>
                <SelectItem value="reviewed">بررسی شده</SelectItem>
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
            <label className="mb-1 block text-xs text-muted-foreground">جستجوی متن</label>
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

      {/* Comment list — tree structure */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
          {items.map((comment) => (
            <AdminCommentTree
              key={comment.id}
              comment={comment}
              depth={0}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground nums-fa">
            مجموع: {toPersianDigits(data?.meta?.total ?? 0)} مورد
          </p>
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

/* ───────── Tree comment renderer ───────── */
function AdminCommentTree({
  comment,
  depth,
  onApprove,
  onReject,
}: {
  comment: Comment;
  depth: number;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const cfg = STATUS_CONFIG[comment.status ?? "PENDING"];

  return (
    <div className={cn("space-y-1", depth > 0 && "pr-4")}>
      <Card className={cn(depth > 0 && "border-r-2 border-r-primary/30")}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-foreground">{comment.authorName ?? "ناشناس"}</span>
                <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                {comment.rating && (
                  <span className="text-xs text-amber-500 nums-fa">★ {toPersianDigits(comment.rating)}</span>
                )}
                <span className="text-[10px] text-muted-foreground">{formatDateTimeFa(comment.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comment.attachments.map((att) => (
                    <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="rounded-md bg-muted px-2 py-1 text-[10px] text-primary hover:underline">
                      <Eye className="ml-1 inline size-3" />
                      {att.originalName}
                    </a>
                  ))}
                </div>
              )}
              {/* Replies toggle */}
              {hasReplies && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  {toPersianDigits(comment.replies!.length)} پاسخ
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {comment.status !== "APPROVED" && (
                <Button variant="ghost" size="icon" className="size-7 text-success" onClick={() => onApprove(comment.id)} title="تأیید">
                  <Check className="size-4" />
                </Button>
              )}
              {comment.status !== "REJECTED" && (
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onReject(comment.id)} title="رد">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nested replies */}
      {expanded && hasReplies && (
        <div className="space-y-1">
          {comment.replies!.map((reply) => (
            <AdminCommentTree
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
