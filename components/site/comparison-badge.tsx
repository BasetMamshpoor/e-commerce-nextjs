"use client";

import Link from "next/link";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Header comparison link.
 * Comparison is now URL-based — no persistent list, so no badge count.
 */
export function ComparisonBadge({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      aria-label="مقایسه محصولات"
      className={cn("relative", className)}
    >
      <Link href="/products">
        <Scale className="size-5" />
      </Link>
    </Button>
  );
}
