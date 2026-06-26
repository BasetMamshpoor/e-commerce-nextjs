"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
}

/**
 * Interactive star rating selector.
 * - readOnly mode: just displays stars (used in summary, comment items)
 * - interactive mode: hover + click to select 1-5
 */
export function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const displayValue = hoverValue ?? value;
  const starSize = size === "sm" ? "size-3.5" : size === "lg" ? "size-6" : "size-5";

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => setHoverValue(null)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`امتیاز ${toPersianDigits(value)} از ${toPersianDigits(5)}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            className={cn(
              "transition-transform",
              !readOnly && "cursor-pointer hover:scale-110",
              readOnly && "cursor-default",
            )}
            aria-label={`${toPersianDigits(star)} ستاره`}
            role={readOnly ? undefined : "radio"}
            aria-checked={readOnly ? undefined : star === value}
          >
            <Star
              className={cn(
                starSize,
                filled
                  ? "fill-warning text-warning"
                  : "fill-muted text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact rating summary: stars + numeric average + count.
 */
export function RatingSummary({
  average,
  count,
  size = "md",
  className,
}: {
  average: number;
  count: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (count === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <StarRating value={0} readOnly size={size} />
        <span>هنوز امتیازی ثبت نشده</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating value={Math.round(average)} readOnly size={size} />
      <span className="text-sm font-medium text-foreground nums-fa">
        {toPersianDigits(average.toFixed(1))}
      </span>
      <span className="text-xs text-muted-foreground nums-fa">
        ({toPersianDigits(count)} نظر)
      </span>
    </div>
  );
}
