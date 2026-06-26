"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWishlist } from "@/features/wishlist/hooks";
import { useAuth } from "@/providers/auth-context";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Header wishlist badge. Shows count if user is authenticated.
 * For guests, links to /login.
 */
export function WishlistBadge({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const { data } = useWishlist();
  const count = data?.meta.total ?? data?.items.length ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      aria-label="علاقه‌مندی‌ها"
      className={cn("relative", className)}
    >
      <Link href={isAuthenticated ? "/wishlist" : "/login?redirect=/wishlist"}>
        <Heart className="size-5" />
        {isAuthenticated && count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {toPersianDigits(count > 99 ? "۹۹+" : count)}
          </span>
        )}
      </Link>
    </Button>
  );
}
