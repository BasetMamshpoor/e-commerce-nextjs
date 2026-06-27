"use client";

import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useComparisonToggle } from "@/features/comparison/hooks";
import { cn } from "@/lib/utils";

interface ComparisonButtonProps {
  productId: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  showLabel?: boolean;
}

/**
 * Comparison toggle button. Works for both guest and authenticated users.
 */
export function ComparisonButton({
  productId,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: ComparisonButtonProps) {
  const { isInComparison, toggle, isPending } = useComparisonToggle();
  const inComparison = isInComparison(productId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  };

  if (showLabel) {
    return (
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={isPending}
        className={cn("gap-1.5", className)}
      >
        <Scale className={cn("size-4", inComparison && "fill-primary text-primary")} />
        {inComparison ? "در مقایسه" : "مقایسه"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isPending}
      className={cn(className)}
      aria-label={inComparison ? "حذف از مقایسه" : "افزودن به مقایسه"}
      aria-pressed={inComparison}
    >
      <Scale className={cn("size-4", inComparison && "fill-primary text-primary")} />
    </Button>
  );
}
