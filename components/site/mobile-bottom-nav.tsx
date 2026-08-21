"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Heart, User } from "lucide-react";

import { useCart } from "@/providers/cart-context";
import { useWishlist } from "@/features/wishlist/hooks";
import { useAuth } from "@/providers/auth-context";
import { toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom navigation bar, mobile only. DOM order is right-to-left
 * (خانه first) since the document is dir="rtl" and a plain flex row lays
 * out children right-to-left already — no flex-row-reverse needed.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { data: wishlist } = useWishlist();
  const wishlistCount = wishlist?.meta.total ?? wishlist?.items.length ?? 0;

  const items = [
    { href: "/", label: "خانه", icon: Home, isActive: pathname === "/" },
    { href: "/categories", label: "دسته‌بندی‌ها", icon: LayoutGrid, isActive: pathname.startsWith("/categories") },
    { href: "/cart", label: "سبد خرید", icon: ShoppingBag, isActive: pathname === "/cart", count: itemCount },
    {
      href: isAuthenticated ? "/wishlist" : "/login?redirect=/wishlist",
      label: "موردعلاقه",
      icon: Heart,
      isActive: pathname === "/wishlist",
      count: isAuthenticated ? wishlistCount : 0,
    },
    {
      href: isAuthenticated ? "/account" : "/login",
      label: "پروفایل",
      icon: User,
      isActive: pathname.startsWith("/account") || pathname === "/login",
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 lg:hidden"
      aria-label="ناوبری اصلی"
    >
      <div className="flex h-16 items-stretch">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              item.isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <item.icon className="size-5" />
              {!!item.count && item.count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {toPersianDigits(item.count > 99 ? "۹۹+" : item.count)}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
