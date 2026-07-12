"use client";

import * as React from "react";
import { Check, X, MessageSquare, ChevronLeft, Trash2, ChevronDown } from "lucide-react";
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

function getAuthorName(c: Comment): string {
  return c.user?.fullName ?? c.authorName ?? "ناشناس";
}

export default function AdminCommentsPage() {
  const [data, setData] = React.useState<PaginatedData<Comment> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [tab, setTab] = React.useState<"ALL" | "PENDING" | "REVIEWED">("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [productSearch, setProductSearch] = React.useState("");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (tab === "PENDING") params.isReviewed = false;
    else if (tab === "REVIEWED") params.isReviewed = true;
    if (typeFilter !== "ALL") params.commentableType = typeFilter;
    if (productSearch.trim()) params.productSearch = productSearch.trim();
    if (search.trim()) params.search = search.trim();
    commentsService.adminList(params).then(setData).finally(() => setLoading(false));
  }, [page, tab, typeFilter, productSearch, search]);

  React.useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    try { await commentsService.adminUpdate(id, { status: "APPROVED" }); toast.success("نظر تأیید شد"); load(); }
    catch { toast.error("عملیات ناموفق بود"); }
  };
  const handleReject = async (id: number) => {
    try { await commentsService.adminUpdate(id, { status: "REJECTED" }); toast.success("نظر رد شد"); load(); }
    catch { toast.error("عملیات ناموفق بود"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("حذف این نظر؟")) return;
    try { await commentsService.delete(id); toast.success("نظر حذف شد"); load(); }
    catch (e: unknown) { const a = e as { message?: string }; toast.error(a?.message ?? "حذف ناموفق بود"); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <MessageSquare className="size-5 text-primary" /> نظرات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت و تأیید نظرات کاربران (محصولات و وبلاگ)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {([{ key: "ALL", label: "همه" }, { key: "PENDING", label: "بررسی‌نشده" }, { key: "REVIEWED", label: "بررسی شده" }] as const).map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={cn("flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
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
            <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="نام محصول..." className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">جستجوی متن نظر</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="متن نظر..." className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }} />
          </div>
        </CardContent>
      </Card>

      {/* Tree comment list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : (data?.items ?? []).length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-12" />} title="نظری یافت نشد" description="با فیلترهای انتخاب‌شده نظری موجود نیست." className="py-12" />
      ) : (
        <div className="space-y-2">
          {(data?.items ?? []).map((c) => (
            <AdminCommentNode key={c.id} comment={c} depth={0} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground nums-fa">مجموع: {toPersianDigits(data?.meta?.total ?? 0)} مورد</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4 rotate-180" /></Button>
            <span className="text-sm nums-fa">صفحه {toPersianDigits(page)} از {toPersianDigits(data?.meta?.totalPages ?? 1)}</span>
            <Button variant="outline" size="icon" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage(page + 1)}><ChevronLeft className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Tree node ───────── */
function AdminCommentNode({
  comment, depth, onApprove, onReject, onDelete,
}: {
  comment: Comment; depth: number; onApprove: (id: number) => void; onReject: (id: number) => void; onDelete: (id: number) => void;
}) {
  const [showReplies, setShowReplies] = React.useState(depth < 1);
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;
  const cfg = STATUS_CONFIG[comment.status ?? "PENDING"];

  return (
    <div className={cn("relative", depth > 0 && "mt-1")}>
      {/* Vertical connector line for nested replies */}
      {depth > 0 && (
        <div className="absolute -right-3 top-0 bottom-0 w-px bg-border" />
      )}
      <Card className={cn(depth > 0 && "border-r-2 border-r-primary/20")}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{getAuthorName(comment)}</span>
                <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                {comment.rating != null && <span className="text-xs text-amber-500 nums-fa">★ {toPersianDigits(comment.rating)}</span>}
                {comment.commentableType && <Badge variant="outline" className="text-[10px]">{comment.commentableType === "PRODUCT" ? "محصول" : "وبلاگ"}</Badge>}
                <span className="text-[10px] text-muted-foreground">{formatDateTimeFa(comment.createdAt)}</span>
              </div>
              {comment.entity && (
                <p className="mt-0.5 text-xs text-primary">
                  {comment.commentableType === "PRODUCT" ? "محصول: " : "مقاله: "}{comment.entity.name}
                </p>
              )}
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
              {/* Media */}
              {comment.media && comment.media.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comment.media.map((m) => (
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
              {/* Show replies toggle */}
              {hasReplies && (
                <button onClick={() => setShowReplies(!showReplies)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                  <ChevronDown className={cn("size-3 transition-transform", !showReplies && "-rotate-90")} />
                  {toPersianDigits(replies.length)} پاسخ
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {comment.status !== "APPROVED" && (
                <Button variant="ghost" size="icon" className="size-7 text-success" onClick={() => onApprove(comment.id)} title="تأیید"><Check className="size-4" /></Button>
              )}
              {comment.status !== "REJECTED" && (
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onReject(comment.id)} title="رد"><X className="size-4" /></Button>
              )}
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(comment.id)} title="حذف"><Trash2 className="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nested replies */}
      {showReplies && hasReplies && (
        <div className="mr-3 mt-1 space-y-1 border-r border-border/40 pr-3">
          {replies.map((r) => (
            <AdminCommentNode key={r.id} comment={r} depth={depth + 1} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
