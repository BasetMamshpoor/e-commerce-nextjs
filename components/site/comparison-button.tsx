"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComparisonButtonProps {
  productId: number;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  showLabel?: boolean;
}

/**
 * Comparison button — now just a link to /comparison/{productId}.
 * Comparison is fully URL-based (no add/remove/clear endpoints).
 */
export function ComparisonButton({
  productId,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: ComparisonButtonProps) {
  if (showLabel) {
    return (
      <Button asChild variant={variant} size="sm" className={cn("gap-1.5", className)}>
        <Link href={`/comparison/${productId}`}>
          <Scale className="size-4" />
          مقایسه
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className} aria-label="مقایسه">
      <Link href={`/comparison/${productId}`}>
        <Scale className="size-4" />
      </Link>
    </Button>
  );
}
