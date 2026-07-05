"use client";

import * as React from "react";
import { Heart, MessageSquare, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { CommentForm } from "./comment-form";
import {
  useLikeComment,
  useDeleteComment,
  useUpdateComment,
} from "@/features/comments/hooks";
import { useAuth } from "@/providers/auth-context";
import { formatRelativeFa, toPersianDigits } from "@/utils/format";
import type { Comment } from "@/types/domain";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
  productId: number;
  /** Depth for indentation (0 = top-level). */
  depth?: number;
}

const MAX_DEPTH = 3;

export function CommentItem({ comment, productId, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const likeMutation = useLikeComment();
  const deleteMutation = useDeleteComment();

  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const isOwnComment = user?.id === comment.authorId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < MAX_DEPTH;
  const liked = comment.isLiked ?? false;

  const handleLike = () => {
    likeMutation.mutate(comment.id);
  };

  const handleDelete = () => {
    if (!confirm("آیا از حذف این نظر مطمئن هستید؟")) return;
    deleteMutation.mutate(comment.id);
  };

  // Get user display name (backend may not include user object — fallback).
  const userName = comment.authorName ?? "کاربر";
  const userInitials = userName
    .split(" ")
    .map((p: string) => p.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <div className={cn("flex gap-3", depth > 0 && "pr-8")}>
      <Avatar className="size-10 shrink-0 border border-border">
        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
          {userInitials || "؟"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{userName}</span>
          {comment.rating != null && (
            <StarRating value={comment.rating} readOnly size="sm" />
          )}
          <span className="text-xs text-muted-foreground">
            {formatRelativeFa(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        {isEditing ? (
          <EditInline
            comment={comment}
            onDone={() => setIsEditing(false)}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2 text-xs",
              liked && "text-primary",
            )}
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <Heart className={cn("size-3.5", liked && "fill-primary")} />
            {comment.likeCount > 0 && (
              <span className="nums-fa">{toPersianDigits(comment.likeCount)}</span>
            )}
          </Button>

          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => setShowReplyForm((v) => !v)}
            >
              <MessageSquare className="size-3.5" />
              پاسخ
            </Button>
          )}

          {isOwnComment && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="size-3.5" />
                ویرایش
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                حذف
              </Button>
            </>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="rounded-lg bg-muted/30 p-3">
            <CommentForm
              productId={productId}
              parentId={comment.id}
              compact
              onSuccess={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && (
          <div className="space-y-3 border-r-2 border-border/40 pr-4">
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                productId={productId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentItemSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}

/* ───────── Inline edit ───────── */

function EditInline({
  comment,
  onDone,
}: {
  comment: Comment;
  onDone: () => void;
}) {
  const update = useUpdateComment();
  const [content, setContent] = React.useState(comment.content);

  const onSubmit = () => {
    if (content.trim().length < 5) {
      toast.error("نظر باید حداقل ۵ کاراکتر باشد");
      return;
    }
    update.mutate(
      { id: comment.id, content },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={update.isPending}
        >
          {update.isPending && <Loader2 className="size-3.5 animate-spin" />}
          ذخیره
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          انصراف
        </Button>
      </div>
    </div>
  );
}
