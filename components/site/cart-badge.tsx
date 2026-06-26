"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/providers/cart-context";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const { itemCount } = useCart();
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      aria-label="سبد خرید"
      className={cn("relative", className)}
    >
      <Link href="/cart">
        <ShoppingBag className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {toPersianDigits(itemCount > 99 ? "۹۹+" : itemCount)}
          </span>
        )}
      </Link>
    </Button>
  );
}
