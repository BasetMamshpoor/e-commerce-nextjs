"use client";

import * as React from "react";
import { MessageSquare, ChevronDown, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { CommentItem, CommentItemSkeleton } from "./comment-item";
import { CommentForm } from "./comment-form";
import { RatingSummary } from "./star-rating";
import {
  useProductComments,
} from "@/features/comments/hooks";
import { toPersianDigits } from "@/utils/format";

interface CommentSectionProps {
  productId: string;
  productName?: string;
}

/**
 * Full comment section for a product:
 *   - Rating summary (stars + average + count)
 *   - Comment form (if logged in)
 *   - Nested comment list with pagination
 */
export function CommentSection({ productId, productName }: CommentSectionProps) {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(true);

  const { data, isLoading, isFetching } = useProductComments(productId, page);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const ratingSummary = data?.ratingSummary;

  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? 1;

  return (
    <section className="mt-8" aria-label="نظرات کاربران">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="size-5 text-primary" />
            نظرات کاربران
            {ratingSummary && ratingSummary.count > 0 && (
              <span className="text-sm font-normal text-muted-foreground nums-fa">
                ({toPersianDigits(ratingSummary.count)})
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Rating summary */}
          {ratingSummary && (
            <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground nums-fa">
                  {toPersianDigits(ratingSummary.average.toFixed(1))}
                </p>
                <p className="text-xs text-muted-foreground">از ۵</p>
              </div>
              <div className="flex-1 space-y-1">
                <RatingSummary
                  average={ratingSummary.average}
                  count={ratingSummary.count}
                  size="md"
                />
                <p className="text-xs text-muted-foreground">
                  {ratingSummary.count > 0
                    ? `بر اساس ${toPersianDigits(ratingSummary.count)} نظر کاربران`
                    : "هنوز نظری ثبت نشده است"}
                </p>
              </div>
            </div>
          )}

          {/* Comment form */}
          {showForm && (
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                {productName ? `نظر شما درباره ${productName}` : "نظر خود را بنویسید"}
              </h3>
              <CommentForm productId={productId} />
            </div>
          )}

          {/* Comment list */}
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentItemSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-12" />}
              title="هنوز نظری ثبت نشده"
              description="اولین نفری باشید که نظر می‌دهد!"
              className="py-8"
            />
          ) : (
            <div
              className={`space-y-6 ${
                isFetching ? "opacity-60 transition-opacity" : ""
              }`}
            >
              {items.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  productId={productId}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                قبلی
              </Button>
              <span className="text-sm text-muted-foreground nums-fa">
                صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
              >
                بعدی
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function CommentSectionSkeleton() {
  return (
    <section className="mt-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
