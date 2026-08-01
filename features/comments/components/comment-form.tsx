"use client";
/* eslint-disable react-hooks/refs */
"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { StarRating } from "./star-rating";
import { useCreateComment } from "@/features/comments/hooks";
import { useAuth } from "@/providers/auth-context";

const commentSchema = z.object({
  content: z
    .string()
    .min(5, "نظر باید حداقل ۵ کاراکتر باشد")
    .max(2000, "نظر نباید بیش از ۲۰۰۰ کاراکتر باشد"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentFormProps {
  productId: number;
  /** If set, this is a reply form (no rating). */
  parentId?: number;
  /** Called after successful submission (to close reply form etc). */
  onSuccess?: () => void;
  /** Compact mode for inline reply. */
  compact?: boolean;
}

/**
 * Comment/reply form.
 * - Top-level: includes 5-star rating selector
 * - Reply (parentId set): no rating, just content
 */
export function CommentForm({
  productId,
  parentId,
  onSuccess,
  compact = false,
}: CommentFormProps) {
  const { isAuthenticated } = useAuth();
  const createComment = useCreateComment();
  const [rating, setRating] = React.useState(0);
  const [ratingTouched, setRatingTouched] = React.useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const isReply = !!parentId;
  const contentLength = useWatch({ control: form.control, name: "content" })?.length ?? 0;

  const onSubmit = async (values: CommentFormValues) => {
    // For top-level comments, rating is required (1-5).
    if (!isReply && (rating < 1 || rating > 5)) {
      setRatingTouched(true);
      toast.error("لطفاً امتیاز خود را انتخاب کنید");
      return;
    }

    createComment.mutate(
      {
        productId,
        content: values.content,
        parentId,
        rating: isReply ? undefined : rating,
        files: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          setRating(0);
          setRatingTouched(false);
          setAttachments([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          onSuccess?.();
        },
      },
    );
  };

  if (!isAuthenticated) {
    return (
      <div
        className={`rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center ${
          compact ? "" : "py-6"
        }`}
      >
        <p className="text-sm text-muted-foreground">
          برای {isReply ? "ثبت پاسخ" : "ثبت نظر"} باید{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            وارد شوید
          </a>
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {/* Rating selector (only for top-level comments) */}
        {!isReply && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              امتیاز شما:
            </span>
            <StarRating
              value={rating}
              onChange={(v) => {
                setRating(v);
                setRatingTouched(true);
              }}
              size="lg"
            />
            {ratingTouched && rating === 0 && (
              <span className="text-xs text-destructive">امتیاز الزامی است</span>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={
                    isReply
                      ? "پاسخ خود را بنویسید..."
                      : "نظر خود را درباره این محصول بنویسید..."
                  }
                  rows={compact ? 3 : 4}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File attachments */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const newFiles = Array.from(e.target.files ?? []);
              setAttachments((prev) => [...prev, ...newFiles]);
            }}
            className="hidden"
            id={`comment-file-${productId}-${parentId ?? "root"}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={createComment.isPending}
          >
            <Paperclip className="size-4" />
            پیوست
          </Button>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attachments.map((f, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                  <span className="max-w-20 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {contentLength} / ۲۰۰۰
          </p>
          <div className="flex gap-2">
            {onSuccess && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSuccess}
                disabled={createComment.isPending}
              >
                انصراف
              </Button>
            )}
            <Button
              type="submit"
              size={compact ? "sm" : "default"}
              disabled={createComment.isPending}
            >
              {createComment.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {isReply ? "ارسال پاسخ" : "ثبت نظر"}
            </Button>
          </div>
        </div>

        {!isReply && (
          <p className="text-xs text-muted-foreground">
            نظر شما پس از تأیید مدیر نمایش داده می‌شود.
          </p>
        )}
      </form>
    </Form>
  );
}
