"use client";

import * as React from "react";
import Link from "next/link";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useComparison } from "@/features/comparison/hooks";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Header comparison badge. Shows count of items in comparison list.
 * Works for both guest and authenticated users.
 */
export function ComparisonBadge({ className }: { className?: string }) {
  const { data } = useComparison();
  const count = data?.items.length ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      aria-label="مقایسه محصولات"
      className={cn("relative", className)}
    >
      <Link href="/comparison">
        <Scale className="size-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {toPersianDigits(count > 4 ? "۴+" : count)}
          </span>
        )}
      </Link>
    </Button>
  );
}
