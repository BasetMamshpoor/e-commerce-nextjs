"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { commentsService } from "@/services";
import { ApiError } from "@/types/api";
import type {
  Comment,
  ProductCommentsData,
} from "@/types/domain";
import { useAuth } from "@/providers/auth-context";

export const COMMENTS_QUERY_KEY = ["comments"] as const;

/**
 * Fetch approved comments for a product (tree structure + rating summary).
 * SSR-friendly: can be called from server components too.
 */
export function useProductComments(
  productId: string | undefined,
  page = 1,
  limit = 20,
) {
  return useQuery<ProductCommentsData>({
    queryKey: [...COMMENTS_QUERY_KEY, "product", productId, page, limit],
    queryFn: () => commentsService.byProduct(productId!, { page, limit }),
    enabled: !!productId,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new comment or reply.
 * - If parentId is set → it's a reply (no rating allowed)
 * - If parentId is null → it's a top-level review (rating 1-5)
 */
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: {
      productId: string;
      content: string;
      parentId?: string;
      rating?: number;
      attachmentMediaIds?: string[];
    }) =>
      commentsService.create(params.productId, {
        content: params.content,
        parentId: params.parentId,
        rating: params.rating,
        attachmentMediaIds: params.attachmentMediaIds,
      }),
    onSuccess: (_data, variables) => {
      // Don't optimistically add — new comments have status=PENDING and
      // won't appear in the public list until approved. Just invalidate.
      queryClient.invalidateQueries({
        queryKey: [...COMMENTS_QUERY_KEY, "product", variables.productId],
      });
      if (variables.parentId) {
        toast.success("پاسخ شما ثبت شد", {
          description: "پس از تأیید مدیر نمایش داده می‌شود",
        });
      } else {
        toast.success("نظر شما ثبت شد", {
          description: "پس از تأیید مدیر نمایش داده می‌شود",
        });
      }
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isUnauthorized) {
        toast.error("برای ثبت نظر باید وارد شوید", {
          action: { label: "ورود", onClick: () => (window.location.href = "/login") },
        });
      } else if (apiErr.status === 400) {
        toast.error(apiErr.message || "اطلاعات نظر نامعتبر است");
      } else {
        toast.error(apiErr.message || "ثبت نظر ناموفق بود");
      }
    },
  });
}

/**
 * Like / unlike a comment (toggle).
 */
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsService.like(commentId),
    onMutate: async (commentId) => {
      // Optimistic: find the comment in any product's cache and toggle like.
      await queryClient.cancelQueries({ queryKey: COMMENTS_QUERY_KEY });

      const queries = queryClient.getQueriesData<ProductCommentsData>({
        queryKey: COMMENTS_QUERY_KEY,
      });

      const previous = queries.map(([key, data]) => ({ key, data }));

      for (const [key, data] of queries) {
        if (!data) continue;
        const updated = toggleLikeInTree(data, commentId);
        if (updated !== data) {
          queryClient.setQueryData(key, updated);
        }
      }

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Rollback
      if (ctx?.previous) {
        for (const { key, data } of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEY });
    },
  });
}

/**
 * Edit own comment content.
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; content: string }) =>
      commentsService.update(params.id, { content: params.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEY });
      toast.success("نظر ویرایش شد", {
        description: "پس از تأیید مجدد مدیر نمایش داده می‌شود",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "ویرایش ناموفق بود");
    },
  });
}

/**
 * Delete own comment (only if no replies).
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEY });
      toast.success("نظر حذف شد");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (apiErr.isConflict) {
        toast.error("این نظر دارای پاسخ است", {
          description: "نمی‌توان آن را حذف کرد",
        });
      } else {
        toast.error(apiErr.message || "حذف ناموفق بود");
      }
    },
  });
}

/* ───────── Helpers ───────── */

/**
 * Recursively toggle like on a comment in the tree.
 * Returns the same object reference if no change was made.
 */
function toggleLikeInTree(
  data: ProductCommentsData,
  commentId: string,
): ProductCommentsData {
  let changed = false;

  const mapComment = (c: Comment): Comment => {
    if (c.id === commentId) {
      changed = true;
      const wasLiked = c.likedByMe ?? false;
      return {
        ...c,
        likedByMe: !wasLiked,
        likeCount: wasLiked ? c.likeCount - 1 : c.likeCount + 1,
      };
    }
    if (c.replies && c.replies.length > 0) {
      const newReplies = c.replies.map(mapComment);
      if (newReplies !== c.replies) {
        return { ...c, replies: newReplies };
      }
    }
    return c;
  };

  const newItems = data.items.map(mapComment);
  if (!changed) return data;

  return { ...data, items: newItems };
}
