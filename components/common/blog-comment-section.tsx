"use client";

import * as React from "react";
import { MessageSquare, Heart, Loader2, Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useAuth } from "@/providers/auth-context";
import { commentsService, mediaService } from "@/services";
import { formatDateTimeFa, formatRelativeFa } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Comment, ProductCommentsData } from "@/types/domain";

interface BlogCommentSectionProps {
  postId: number;
  postTitle: string;
}

export function BlogCommentSection({ postId, postTitle }: BlogCommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = React.useState<ProductCommentsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [content, setContent] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<number | null>(null);
  const [replyContent, setReplyContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    commentsService
      .byBlogPost(postId, { page, limit: 20 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [postId, page]);

  React.useEffect(() => { load(); }, [load]);

  const onSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      if (files.length > 0) {
        // Multipart with attachments
        const fd = new FormData();
        fd.append("content", content.trim());
        for (const f of files) fd.append("attachments", f);
        // Use the raw upload method
        const { http } = await import("@/lib/api-client");
        const { ENDPOINTS } = await import("@/api/endpoints");
        await http.upload<Comment>(ENDPOINTS.comments.createBlog(postId), fd);
      } else {
        await commentsService.createBlog(postId, { content: content.trim() });
      }
      toast.success("نظر شما ثبت شد", { description: "پس از تأیید مدیر نمایش داده می‌شود" });
      setContent("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch {
      toast.error("ثبت نظر ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  const onReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await commentsService.createBlog(postId, { content: replyContent.trim(), parentId });
      toast.success("پاسخ ثبت شد", { description: "پس از تأیید مدیر نمایش داده می‌شود" });
      setReplyContent("");
      setReplyTo(null);
      load();
    } catch {
      toast.error("ثبت پاسخ ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  const onLike = async (commentId: number) => {
    try {
      await commentsService.like(commentId);
      load();
    } catch {
      // silent
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <MessageSquare className="size-5 text-primary" />
        نظرات ({data?.meta ? toPersianDigits(data.meta.total) : "۰"})
      </h2>

      {/* Comment form */}
      {isAuthenticated ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="نظر خود را درباره این مقاله بنویسید..."
              rows={3}
              className="resize-none"
            />
            {/* Attachments */}
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...newFiles]);
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
                پیوست
              </Button>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {files.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      <span className="max-w-20 truncate">{f.name}</span>
                      <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-destructive">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Button
                className="mr-auto"
                size="sm"
                onClick={onSubmit}
                disabled={submitting || !content.trim()}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                ثبت نظر
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            برای ثبت نظر باید{" "}
            <a href="/login" className="font-medium text-primary hover:underline">وارد شوید</a>
          </CardContent>
        </Card>
      )}

      {/* Comment list — tree */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-10" />}
          title="هنوز نظری ثبت نشده"
          description="اولین نفر باشید که نظر می‌دهد."
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {items.map((comment) => (
            <BlogCommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={onReply}
              onLike={onLike}
              submitting={submitting}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BlogCommentItem({
  comment,
  depth,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent,
  onReply,
  onLike,
  submitting,
  isAuthenticated,
}: {
  comment: Comment;
  depth: number;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  replyContent: string;
  setReplyContent: (v: string) => void;
  onReply: (parentId: number) => void;
  onLike: (id: number) => void;
  submitting: boolean;
  isAuthenticated: boolean;
}) {
  const maxDepth = 3;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={cn("space-y-1", depth > 0 && "pr-4")}>
      <div className={cn("rounded-lg border border-border/40 p-3", depth > 0 && "border-r-2 border-r-primary/30")}>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {(comment.authorName ?? "؟").charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">{comment.authorName ?? "ناشناس"}</span>
          <span className="text-[10px] text-muted-foreground">{formatRelativeFa(comment.createdAt)}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
        {/* Attachments */}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {comment.attachments.map((att) => (
              <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md">
                {att.mimeType?.startsWith("image/") ? (
                   
                  <img src={att.url} alt={att.originalName} className="size-16 object-cover" />
                ) : (
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-primary">{att.originalName}</span>
                )}
              </a>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button
            onClick={() => onLike(comment.id)}
            className={cn("flex items-center gap-1 transition-colors", comment.isLiked ? "text-primary" : "text-muted-foreground hover:text-primary")}
          >
            <Heart className={cn("size-3.5", comment.isLiked && "fill-current")} />
            {toPersianDigits(comment.likeCount)}
          </button>
          {isAuthenticated && depth < maxDepth && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              پاسخ
            </button>
          )}
        </div>
        {/* Inline reply form */}
        {replyTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="پاسخ خود را بنویسید..."
              rows={2}
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={() => onReply(comment.id)}
              disabled={submitting || !replyContent.trim()}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && (
        <div className="space-y-1">
          {comment.replies!.map((reply) => (
            <BlogCommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={onReply}
              onLike={onLike}
              submitting={submitting}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function toPersianDigits(n: number): string {
  return n?.toString()?.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]) ?? "۰";
}
